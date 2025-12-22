---
title: 01 JAX Basics - Framework Benchmarks & JIT Compilation
date: 2025-12-20 20:51:06
categories:
  - blogs
tags:
  - JAX
  - Python
  - AI
  - Machine Learning
toc: true
---
A deep dive into JAX fundamentals, comparing it with PyTorch and TensorFlow, and understanding JIT compilation.

<!-- more -->

```python
import torch
import tensorflow as tf
import jax
import numpy as np
```

## PRNG Key in Torch, Tensorflow and JAX

- In PyTorch and TensorFlow, setting a seed updates a global state hidden in the background. Every time you generate a random number, that global state is automatically mutated.
- In **JAX** there is no global state which is getting mutated, instead you pass the key explicitly everytime and get the same number.
- To get new random number you split/mutate the existing key and then generate again with new key.

### Torch

```python
torch.manual_seed(42)
print(torch.randn(1)) # Value A
print(torch.randn(1)) # Value B (It remembers the state and generate new random numbers)
```

```
tensor([0.3367])
tensor([0.1288])
```

### Tensorflow

```python
tf.random.set_seed(42)
print(tf.random.normal([1])) # Value A
print(tf.random.normal([1])) # Value B (It remembers the state and generate new random numbers)
```

```
tf.Tensor([-0.39872527], shape=(1,), dtype=float32)
tf.Tensor([0.8794899], shape=(1,), dtype=float32)
```

### JAX

```python
key = jax.random.key(42)
print(jax.random.normal(key)) # Value X
print(jax.random.normal(key)) # Value X (Always the same!)
```

```
-0.18471177
-0.18471177
```

#### To generate new numbers here we need to split the key

```python
# Split the master key into two new keys
key, subkey = jax.random.split(key)

# Use the subkey for your random number
print(jax.random.normal(subkey)) # Value Y (New!)
```

```
1.3694694
```

## Now lets jump to comparing the speeds

Notes:

- JAX/TF: They are "Greedy." They pre-allocate a fixed percentage (usually 75% for JAX) of the GPU memory at startup to optimize for speed and avoid the overhead of asking the OS for memory repeatedly.

- PyTorch: It is "Lazy." It allocates memory on-demand. This is why it feels "lighter" initially, but it can lead to fragmentation in long-running training jobs.

```python
size = 3000
```

```python
import os

# avoids pre allocatin the GPU memory
os.environ['XLA_PYTHON_CLIENT_PREALLOCATE'] = 'false'

# avoids pre allocatin the GPU memory
gpus = tf.config.list_physical_devices('GPU')
if gpus:
  tf.config.experimental.set_memory_growth(gpus[0], True)
```

```python
key = jax.random.key(42)

# lets put jax array in CPU because if we are using GPU it places array direclty in GPU
cpus = jax.devices("cpu")
with jax.default_device(cpus[0]):
    # This is created directly in RAM, GPU is never touched
    x_jnp = jax.random.normal(key, (size, size))

# same case with Tensorflow we need to mention where to place the data
with tf.device('/CPU:0'):
  x_tf = tf.random.normal((size, size))


# torch doesn't do until you explicityly move to cuda device.
x_torch = torch.randn(size, size)
```

```python
x_jnp.device, x_tf.device, x_torch.device
```

```
(CpuDevice(id=0), '/job:localhost/replica:0/task:0/device:CPU:0', device(type='cpu'))
```

### CPU

#### JAX

- When you call `jnp.dot(x, y)`, JAX doesn't wait for the CPU/GPU to finish the math. Instead, it immediately returns a `DeviceArray` (a pointer to the future result)

- `block_until_ready()` will wait till the execution completes so you can time it properly

```python
with jax.default_device(cpus[0]):
  %time jax.numpy.dot(x_jnp, x_jnp.T) # this will show compilation time and then you can see the return value later
```

```
CPU times: user 1.23 s, sys: 89.2 ms, total: 1.32 s
Wall time: 332 ms
```

```python
# and lets the Python thread continue. The actual computation happens in the background on the accelerator.
with jax.default_device(cpus[0]):
  %timeit jax.numpy.dot(x_jnp, x_jnp.T).block_until_ready() # this will wait till the execution also completes
```

```
332 ms ± 5.67 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)
```

#### Tensorflow

```python
with tf.device('/CPU:0'):
  %timeit tf.matmul(x_tf, x_tf) # here that is the not the case it executes eagerly
```

```
350 ms ± 12.3 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)
```

#### Torch

```python
%timeit torch.matmul(x_torch, x_torch) # here that is the not the case it executes eagerly
```

```
345 ms ± 8.91 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)
```

### GPU

*   **Inputs are Pre-Loaded on Device:**
    The input arrays (`x_jnp`, `x_tf`, `x_torch`) are moved to the GPU memory (VRAM) *before* the timer starts. The overhead of moving data **to** the GPU is **excluded** from the benchmark.
*   **Computation Happens on GPU:**
    The matrix multiplication logic is executed entirely by the GPU cores.
*   **Result is Transferred Back to Host (CPU):**
    By calling `.numpy()` (TF/JAX) or `.cpu()` (PyTorch), you force the resulting tensor to be copied from GPU memory back to CPU RAM.
*   **Implicit Synchronization:**
    Because the CPU cannot access the data until the GPU is finished calculating and transferring it, this forces the CPU to wait. This ensures `%timeit` captures the full duration of the operation, effectively "blocking" the asynchronous nature of the GPU.

```python
x_jnp = jax.random.normal(key, (size, size)) # sits in GPU by default
x_tf = tf.random.normal((size, size)) # sits in GPU by default
if torch.cuda.is_available():
  x_torch = torch.randn(size, size).cuda() # sits in GPU
```

#### JAX

```python
%timeit np.array(jax.numpy.dot(x_jnp, x_jnp.T).block_until_ready())
```

```
12.5 ms ± 245 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

#### Tensorflow

- Same as JAX, Tensorflow also dispatchs asynchornously so if you try directly timeit it will keep queueing not the math

```python
%timeit tf.matmul(x_tf, x_tf).numpy()
```

```
13.2 ms ± 312 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

#### Torch

```python
%timeit torch.matmul(x_torch, x_torch).cpu()
```

```
12.8 ms ± 289 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

## TPU(Tensor Processing Units)

- JAX Natively works on TPU.
- TPU's are custom made chips from google to train ML models.
- They are just built to calculate large matrix operations, here is the full [page](https://docs.cloud.google.com/tpu/docs/system-architecture-tpu-vm) to study.
- We can run Tensorflow as well on TPU's but it needs a little bit of setup initially in colab.

```python
import jax
import numpy as np
```

```python
jax.devices()
```

```
[TpuDevice(id=0, process_index=0, coords=(0,0,0), core_on_chip=0)]
```

```python
key = jax.random.key(42)
size = 3000
```

```python
x_jnp = jax.random.normal(key, (size, size)) # sits in TPU by default
```

```python
%timeit np.array(jax.numpy.dot(x_jnp, x_jnp.T).block_until_ready()) # matrix is in on CPU
```

```
8.45 ms ± 156 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

```python
%timeit jax_dot(x_jnp).block_until_ready().device # the result is also in TPU
```

```
2.12 ms ± 45.3 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

## More about JAX Now

1. **JAX Arrays are immutable** - You cannot modify arrays in-place
2. **Functional programming** - JAX relies on pure functions
3. **Different random number generation** - Explicit key-based PRNG
4. **Stateless** - State must be passed explicitly
5. **Accelerator agnostic** - Same code runs on CPU, GPU, or TPU

```python
def selu(x, alpha=1.67, lmbda=1.05):
  return lmbda * jax.numpy.where(x > 0, x, alpha * jax.numpy.exp(x) - alpha)
```

```python
%timeit selu(x_jnp).block_until_ready()
```

```
15.2 ms ± 234 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)
```

```python
%timeit jax.jit(selu)(x_jnp).block_until_ready() # JIT(Just in Time Compilation)
```

```
1.85 ms ± 42.1 µs per loop (mean ± std. dev. of 7 runs, 1000 loops each)
```

### How JIT Works: Tracing

- JIT works by **tracing** your function. During tracing, JAX replaces actual values with abstract "tracers" that only track shapes and types:

- **Key Insight:** Same shape + same type = reuse cached compiled function!

- Now while training first step will take longer because it needs to compile the function but subsequent calls with same shape and type will be lightning fast as it uses the cached compiled version.

```python
@jax.jit
def f(x, y):
    print("Running f():")
    print(f" x = {x}")
    print(f" y = {y}")
    result = jax.numpy.dot(x + 1, y + 1)
    print(f" result = {result}")
    return result

x = np.random.randn(3, 4)
y = np.random.randn(4)
```

```python
print(f(x, y)) # first call traces function
```

```
Running f():
 x = Traced<ShapedArray(float64[3,4])>with<DynamicJaxprTrace(level=1/0)>
 y = Traced<ShapedArray(float64[4])>with<DynamicJaxprTrace(level=1/0)>
 result = Traced<ShapedArray(float64[3])>with<DynamicJaxprTrace(level=1/0)>
[-0.40256596 -0.1671931   1.68532903]
```

```python
print(f(x, y)) # Second call - uses cached compiled version (no print!)
```

```
[-0.40256596 -0.1671931   1.68532903]
```

### Viewing the JAX Expression (jaxpr)

```python
def f(x, y):
    return jax.numpy.dot(x + 1, y + 1)

print(jax.make_jaxpr(f)(x, y))
```

```
{ lambda ; a:f64[3,4] b:f64[4]. let
    c:f64[3,4] = add a 1.0
    d:f64[4] = add b 1.0
    e:f64[3] = dot_general[dimension_numbers=(([1], [0]), ([], []))] c d
  in (e,) }
```

### JIT Pitfalls

- You can find full sharpbits in jax here more extensive: [🔪 sharpbits](https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html) which is much more extensive and if I miss something or made a mistake please correct me

####  1: Dynamic Shapes

- JIT requires **static shapes**. Boolean indexing creates dynamic shapes:
- Basically you trying to change the output of the function dynamically based on the boolean value, so this causes the error in `jit` compilation.

```python
def get_negatives(x):
    return x[x < 0]  # Shape depends on values!

x = jax.random.normal(key, (10,))
get_negatives(x)  # Works without JIT
```

```python
try:
  jax.jit(get_negatives)(x)
except Exception as NonConcreteBooleanIndexError:
  print(NonConcreteBooleanIndexError)
```

```
Abstract tracer value encountered where concrete value is expected: traced array with shape bool[10].
The problem arose with the `bool` function. 
The error occurred while tracing the function get_negatives at <ipython-input>.
```

#### 2. Value-Dependent Control Flow

- Python tries to execute the if immediately during compilation (tracing).
- It needs to know the value of neg right now to decide which branch to compile.
- But neg is just a placeholder (a Tracer) that doesn't have a value yet.
- Since Python can't decide, it crashes.

```python
@jax.jit
def f(x, neg):
    return -x if neg else x  # Control flow depends on VALUE

f(1, True)
```

```
`TracerBoolConversionError`: Attempted boolean conversion of traced array with shape bool[].
```

- We can make use of `static_argnames` if that particular doesn't change in training and its not related to data batching flag.

```python
from functools import partial


@jax.jit
@partial(jit, static_argnames=['neg'])
def f(x, neg=True):
    return -x if neg else x  # Control flow depends on VALUE

f(1, True)
```

```
Array(-1, dtype=int32, weak_type=True)
```

#### 3. Using JAX Arrays for Shapes

- You converted the shape (2, 3) into a JAX array.
- JAX treats all JAX arrays as "values that will exist on the GPU later" (Tracers).
- reshape needs to know the exact size right now to allocate memory in the compiled graph. You gave it a "future value" placeholder, so the compiler panics because it can't build a graph with unknown dimensions.

```python
@jit
def f(x):
    # BAD: jnp.array(x.shape) creates a traced value
    return x.reshape(jnp.array(x.shape).prod())
f(jnp.ones((2, 3)))  # ERROR!
```

```
TypeError: Shapes must be 1D sequences of concrete values of integer type, got [Traced<ShapedArray(int64[])>].
```

```python
@jit
def f(x):
    return x.reshape((np.prod(x.shape),))

f(jnp.ones((2, 3)))  # Works!
```

```
Array([1., 1., 1., 1., 1., 1.], dtype=float32)
```
