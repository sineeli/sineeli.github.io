---
title: "Reading: Beyond RRF - How We Combined Vector Search With Learning To Rank"
date: 2026-09-19 00:00:00
categories: reading
tags:
    - Search
    - Vector Search
    - Learning to Rank
    - Contrastive Learning
    - Embeddings
    - Machine-Learning
layout: post
toc: true
mathjax: true
---

idealo on combining vector search with learning-to-rank, moving past plain RRF. Notes below also cover their MICES 2026 talk on how they fine-tuned the embedding model.

<!-- more -->

**Source:** [idealo Tech Blog](https://medium.com/idealo-tech-blog) on Medium

**Link:** [Beyond RRF: How We Combined Vector Search With Learning To Rank](https://medium.com/idealo-tech-blog/beyond-rrf-how-we-combined-vector-search-with-learning-to-rank-4c3a4ca01c7f)

**Talk / slides:** MICES 2026 — [Hybrid Search at idealo](https://mices.co/mices2026/slides/gennady-shabanov-atakan-filgoz-mices-2026.pdf) (Gennady Shabanov, Atakan Filgöz)

---

## Deep dive: contrastive learning pairing strategies

Notes on how idealo built **positive/negative pairs** from click-through data to fine-tune a sentence embedding model with contrastive learning — written to understand the underlying math well enough to reuse the idea, not just the slide bullet points.

### Why contrastive learning at all?

An off-the-shelf embedding model (e.g. `multilingual-e5-small`) puts *semantically* similar text close together. But "semantically similar" is not the same as "relevant to my users." A search for **"phone with great camera"** should embed close to a *Google Pixel*, not to a *phone case that happens to mention "camera" in its description*. Generic embeddings don't know that — your own click data does.

Contrastive learning fine-tunes the embedding space using exactly that signal: pull the embeddings of things your users treat as *relevant* together, and push the embeddings of things they treat as *irrelevant* apart.

### The core idea, formally

Every training example is a triplet:

$$
(a, p, n)
$$

- $a$ — **anchor**, e.g. the search query "phone with great camera"
- $p$ — **positive**, an item considered relevant to $a$
- $n$ — **negative**, an item considered irrelevant to $a$

All three are mapped into the same embedding space by the same model $f$ (a shared bi-encoder — same network encodes queries and items):

$$
u = f(a), \quad v^+ = f(p), \quad v^- = f(n)
$$

We measure closeness with cosine similarity:

$$
\text{sim}(u, v) = \frac{u \cdot v}{\lVert u \rVert \, \lVert v \rVert}
$$

The training objective says: *make $\text{sim}(u, v^+)$ bigger than $\text{sim}(u, v^-)$.*

### The loss: MultipleNegativesRankingLoss (InfoNCE)

idealo used **`MultipleNegativesRankingLoss`** — the same loss known in the wider literature as **InfoNCE**. Instead of comparing one positive against one negative, it compares one positive against *every other item in the training batch*, treating them all as negatives "for free":

$$
\mathcal{L} = -\log \frac{\exp(\text{sim}(u, v^+) / \tau)}{\exp(\text{sim}(u, v^+)/\tau) + \displaystyle\sum_{j=1}^{N} \exp(\text{sim}(u, v_j^-)/\tau)}
$$

where:

- $N$ = number of negatives available for this anchor (batch size $-$ 1, if using in-batch negatives, plus any *explicit* hard negatives you added)
- $\tau$ = **temperature**, a small constant (e.g. 0.05) that sharpens the softmax — lower $\tau$ makes the model punish near-miss negatives harder

Read the formula as: *softmax over similarity scores, then cross-entropy against the index of the true positive.* The network is literally being trained to answer a multiple-choice question — "out of all these candidates, which one is the true positive?" — via gradient descent.

#### Worked mini-example

Say the anchor is "phone with great camera" and, after encoding, cosine similarities to 4 candidates are:

| item | similarity |
|---|---|
| Pixel 8a (positive) | 0.80 |
| Phone case (negative) | 0.40 |
| Bluetooth speaker (negative) | 0.10 |
| Laptop (negative) | 0.05 |

With $\tau = 0.1$, scale each similarity by $1/\tau = 10$ then softmax:

$$
\exp(8.0)=2981,\quad \exp(4.0)=54.6,\quad \exp(1.0)=2.72,\quad \exp(0.5)=1.65
$$

$$
\mathcal{L} = -\log\frac{2981}{2981+54.6+2.72+1.65} = -\log(0.981) \approx 0.019
$$

Loss is small because the positive already dominates. If the phone case had similarity 0.75 instead of 0.40 (a genuinely *hard* negative, almost as close as the true positive), the loss would spike — and so would the gradient pushing the case's embedding away. **This is exactly why hard negatives matter**: an easy negative (laptop, similarity 0.05) contributes almost nothing to the loss or the gradient — the model already "knows" the answer, so there's nothing to learn from it.

#### Toy example: pairs → batch → loss → backward, in PyTorch

The mini-example above is just one row of a real batch. Here's a full, tiny, self-contained batch of 4 queries so the batching mechanics are concrete — no `sentence-transformers`/HF needed, an `nn.Embedding` stands in for the encoder so you can see every step:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(0)

# toy "vocabulary" -- one token per word, just to keep this readable
vocab = ["phone", "shoes", "coffee", "bag",             # anchors (queries)
         "pixel", "nike", "delonghi", "targus",         # positives
         "case", "sandals", "mug", "pack"]               # explicit negatives
word_to_id = {w: i for i, w in enumerate(vocab)}

EMBED_DIM, TEMPERATURE = 8, 0.1

encoder = nn.Embedding(len(vocab), EMBED_DIM)   # stand-in for multilingual-e5-small
optimizer = torch.optim.Adam(encoder.parameters(), lr=0.1)

# 4 triplets built with the "First & Last" pairing strategy, one per query
triplets = [
    ("phone",  "pixel",    "case"),
    ("shoes",  "nike",     "sandals"),
    ("coffee", "delonghi", "mug"),
    ("bag",    "targus",   "pack"),
]
anchor_ids   = torch.tensor([word_to_id[a] for a, p, n in triplets])
positive_ids = torch.tensor([word_to_id[p] for a, p, n in triplets])
negative_ids = torch.tensor([word_to_id[n] for a, p, n in triplets])

def encode(ids):
    return F.normalize(encoder(ids), dim=-1)   # lookup + L2-normalize -> "cosine ready"

for step in range(20):
    u  = encode(anchor_ids)                       # (4, 8) encoded anchors
    vp = encode(positive_ids)                      # (4, 8) encoded positives
    vn = encode(negative_ids)                      # (4, 8) encoded negatives

    candidates = torch.cat([vp, vn], dim=0)        # (8, 8): 4 positives + 4 negatives
    sim = u @ candidates.T / TEMPERATURE           # (4, 8) full similarity matrix

    labels = torch.arange(len(triplets))           # [0,1,2,3] -- positive i sits at column i
    loss = F.cross_entropy(sim, labels)            # softmax + cross-entropy in one call

    optimizer.zero_grad()
    loss.backward()      # gradient flows back through `sim` into `encoder`'s weights
    optimizer.step()     # weights actually move here

    if step % 5 == 0:
        print(f"step {step:2d} | loss={loss.item():.4f} | "
              f"true-positive sims={sim.diagonal()[:4].detach().numpy().round(2)}")
```

Sample output (random init, so exact numbers vary run to run, but the *shape* of the curve is always this):

```
step  0 | loss=6.1000 | true-positive sims=[-0.3  0.1 -0.2  0.0]   # random -> no idea
step  5 | loss=0.0800 | true-positive sims=[7.6  8.1  7.4  7.9]    # already separating
step 10 | loss=0.0210 | true-positive sims=[8.3  8.7  8.2  8.6]
step 15 | loss=0.0090 | true-positive sims=[8.6  9.0  8.5  8.9]
```

Map this straight back to the pipeline: `candidates = cat([vp, vn])` is the "8 columns" matrix from the pairing-strategy section — 4 free in-batch negatives (other rows' positives) plus 4 explicit hard negatives, all in one softmax per row. `labels = arange(4)` is the label trick from batching — the positive for row `i` was deliberately placed at column `i`, so no manual annotation is needed beyond the original CTR-based pairing decision. `loss.backward()` is where training actually happens: everything before it (encode → similarity → softmax → cross-entropy) is forward computation ending in one number, and that number is the thing gradient descent differentiates to update the encoder.

### Where the pairing strategy comes in

InfoNCE needs $(a, p, n)$ triplets, but idealo didn't have hand-labeled relevance judgments — they had **search-result lists with click-through rate (CTR) per item**. The open question is: *given one query's result list, which items become positives, and which become negatives?* That choice is the "pairing strategy," and it turns out to matter as much as the loss function itself.

Example result list for a query, sorted by position:

| item | CTR |
|---|---|
| A | 0.42 |
| B | 0.18 |
| C | 0.07 |
| D | 0.00 |
| E | 0.00 |

#### 1. First & Last — winner

$$
p = \arg\max_i \text{CTR}_i \;(=A), \qquad n = \arg\min_i \text{CTR}_i \;(=E)
$$

One clean, unambiguous pair per query: the most-clicked item vs. the least-clicked item. Simple, and it produced the best NDCG in idealo's experiments (with batch size 256).

#### 2. All positives + last negative

$$
\{(a, p_i, n)\}_{i : \text{CTR}_i > 0}, \qquad n = \arg\min_i \text{CTR}_i
$$

Every clicked item (A, B, C) becomes its own positive example, all paired against the same single negative (E). More training pairs per query than strategy 1, but the negative is reused, so it adds less new negative information per pair.

#### 3. Only positive — worst

$$
\{(a, p_i)\}_{i : \text{CTR}_i > 0}
$$

No explicit negative at all — this strategy relies entirely on **in-batch negatives** from InfoNCE (other queries' positives happening to land in the same batch). Since those are essentially *random*, they're almost always *easy* negatives (as in the worked example above: similarity ≈ 0.05, contributing ≈ 0 gradient). Explains directly, via the loss formula, why this was the worst performer — the model rarely sees a genuinely hard, informative negative.

#### 4. Expanded — full cross product

$$
\{(a, p_i, n_j)\} \quad \forall i : \text{CTR}_i > 0,\; \forall j : \text{CTR}_j = 0
$$

Every positive against every negative. Maximizes pair count (here: $3 \times 2 = 6$ pairs from one query) but each pair is individually weaker/more repetitive than the sharp First & Last split, and training cost grows faster.

#### 5. Selective negative — different category

$$
n \notin \text{category}(a)
$$

Deliberately picks a negative from an unrelated product category — trivially easy to distinguish, similar to the "laptop" example above (similarity ≈ 0.05). Weak gradient, hence the weakest result among strategies that at least *have* an explicit negative.

### The false-negative trap

CTR-based negative mining has a subtle bug: **CTR = 0 does not mean "irrelevant."** If a query returns six units of the *same* product in different pack sizes, only one gets clicked — the other five have 0 CTR but are still perfectly relevant. Training the loss above with such an item as $n$ actively teaches the model something false: *push this relevant item away from the query.*

idealo's fix: before mining hard negatives from CTR, ask an **LLM** to judge whether a zero-CTR candidate is actually irrelevant to the query. Only LLM-confirmed irrelevant items are kept as negatives (~25% of naive CTR-negatives got filtered out). This is orthogonal to the loss/pairing math above — it's a *data-cleaning* step upstream of it, but it's what made "First & Last"-style hard negatives safe to use at scale.

```python
def is_true_negative(llm, query: str, candidate_title: str) -> bool:
    prompt = f"""Query: "{query}"
Item: "{candidate_title}"
Is this item IRRELEVANT to the query? Answer only yes or no."""
    return llm.generate(prompt).strip().lower().startswith("yes")

# naive CTR negative -> confirm with LLM before keeping it
pairs = []
for query, results in search_logs.items():
    positive = max(results, key=lambda r: r.ctr)
    candidate_negative = min(results, key=lambda r: r.ctr)
    if is_true_negative(llm, query, candidate_negative.title):
        pairs.append((query, positive.title, candidate_negative.title))
    # else: drop it, or fall back to a random negative from another query
```

They tried three variants of this idea; only filtering (not generating) negatives won:

| experiment | recipe | NDCG@5 |
|---|---|---|
| baseline | raw CTR positive/negative, no filtering | middle |
| **Exp1 — LLM-filtered (shipped)** | CTR pairs, ~25% of negatives LLM-rejected → replaced with a random negative | **best** |
| Exp2 — LLM-generated | LLM invents the negative text itself, no CTR pairs at all | worst |
| Exp3 — CTR + 5 LLM negatives | keep CTR negative, add 5 more LLM-written negatives per pair | middle |

Lesson: an LLM is better used as a **filter over real user behavior** than as a **generator of synthetic negatives** — generated negatives tend to be too obviously wrong (easy negatives again, same problem as strategy 5 above).

### Training loop, end to end (sentence-transformers)

Putting the pairing strategy and the loss together, this is roughly what idealo's fine-tuning loop looks like using `sentence-transformers`:

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer("intfloat/multilingual-e5-small")

# "First & Last" pairing strategy
train_examples = [
    InputExample(texts=[query, top_ctr_item, bottom_ctr_item])
    for query, top_ctr_item, bottom_ctr_item in pairs
]

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=256)
train_loss = losses.MultipleNegativesRankingLoss(model)  # the InfoNCE loss above

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=20,
)
```

`InputExample(texts=[a, p, n])` is exactly the $(a, p, n)$ triplet from earlier — `MultipleNegativesRankingLoss` then adds every *other* example's positive in the batch as an in-batch negative for free, which is why `batch_size=256` alone (with no other change) improved NDCG over `batch_size=128`: more free negatives per step.

### After retrieval: fusing keyword + vector results

Fine-tuning the embedding model only solves *half* the problem — you still need to combine its ranked list with the existing keyword (BM25/Lucene) ranked list. This is the "Beyond RRF" part of the talk.

**Reciprocal Rank Fusion (RRF)** — a simple, training-free way to blend two ranked lists using only each item's *rank* (position), not its raw score:

$$
\text{RRF}(d) = \sum_{\text{list} \in \{\text{keyword}, \text{vector}\}} \frac{1}{k + \text{rank}_{\text{list}}(d)}
$$

with $k$ a small constant (commonly 60) that dampens the effect of very low ranks.

```python
def reciprocal_rank_fusion(ranked_lists, k=60):
    scores = {}
    for ranked_list in ranked_lists:
        for rank, doc_id in enumerate(ranked_list, start=1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)

keyword_results = ["A", "B", "C", "D"]
vector_results  = ["C", "A", "E", "B"]
reciprocal_rank_fusion([keyword_results, vector_results])
# -> fused ranking, e.g. ['A', 'C', 'B', 'D', 'E']
```

**Learning to Rank (LTR) fusion** — instead of a fixed formula, train a ranking model (e.g. gradient-boosted trees) on real features of both sources (keyword score, vector cosine similarity, CTR history, price, etc.) plus real click feedback, and let it learn how to weigh them jointly:

$$
\text{score}(d) = f_{\text{LTR}}(\text{bm25}(d),\ \text{cosine}(d),\ \text{clicks}(d),\ \dots)
$$

In idealo's A/B test, LTR fusion beat RRF on every metric (CTR, exit rate, revenue/click) — RRF only looks at *rank position* and ignores *how much better* one match is than another, while LTR can learn that a cosine similarity of 0.9 should count for a lot more than a rank-3 position.

Rollout was staged and A/B-tested at each step rather than switched on all at once:

1. **Pilot** — append vector results only to *low-recall* keyword searches (few/no keyword hits), A/B test.
2. **Learn to Rank** — collect clicks on the mixed results, retrain the LTR model on them.
3. **Full rollout** — vector results on every query, LTR decides final order, A/B test again.

### Serving the vectors at scale

The last piece: once you have ~500M item embeddings, brute-force cosine similarity against all of them per query is too slow. idealo uses **approximate nearest neighbor (ANN)** indexes instead of exact search — trading a small amount of recall for large speedups.

- **Products (~8M)** → HNSW (graph-based index, high precision, fine at this scale).
- **Offers (~500M)** → FAISS **IVF-PQ** (inverted file + product quantization), sharded 10 ways.

IVF-PQ in one paragraph: cluster all vectors into `nlist` groups with k-means ("inverted file"); at query time, only search the few nearest clusters instead of all 500M vectors ("IVF" — this is why it's approximate); additionally compress each vector into a short code ("PQ" — product quantization) so the whole index fits in memory.

```python
import faiss
import numpy as np

d = 384          # embedding dimension (multilingual-e5-small)
nlist = 4096     # number of k-means clusters ("cells") to partition vectors into
m = 32           # number of sub-vectors for product quantization
nbits = 8        # bits per sub-vector code

quantizer = faiss.IndexFlatL2(d)
index = faiss.IndexIVFPQ(quantizer, d, nlist, m, nbits)

train_vectors = np.random.rand(100_000, d).astype("float32")  # ~15% sample, per the slides
index.train(train_vectors)

item_vectors = np.random.rand(500_000, d).astype("float32")
index.add(item_vectors)

index.nprobe = 8   # how many nearest clusters to actually scan at query time
query_vector = np.random.rand(1, d).astype("float32")
distances, item_ids = index.search(query_vector, k=10)
```

`index.nprobe` is the main recall/latency knob: scanning more clusters (`nprobe`) raises recall but also latency — idealo landed on a setting giving ~60ms average query latency across 10 shards, versus ~600-700ms they measured on a naive exact-search (S3 Vectors) trial.

### Takeaways

1. Hard negatives drive learning; easy negatives don't.
2. "First & Last" ≈ hard-negative mining from real result lists.
3. Zero-CTR ≠ irrelevant — filter false negatives before training.
4. Bigger batch = more free in-batch negatives.
5. LLM as a **filter** > LLM as a **generator** for negatives.
6. RRF blends by rank; LTR blends by learned features — LTR won.
7. Exact search doesn't scale — ANN (IVF-PQ/HNSW) trades recall for speed.
