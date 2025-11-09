# Hexo Post Configuration Guide

Complete reference for configuring your blog posts with Icarus theme.

## Table of Contents
- [Basic Front Matter](#basic-front-matter)
- [Visual Content](#visual-content)
- [Code Highlighting](#code-highlighting)
- [Time Display](#time-display)
- [Table of Contents](#table-of-contents)
- [Sidebar Widgets](#sidebar-widgets)
- [SEO & Social Media](#seo--social-media)
- [Custom Settings](#custom-settings)
- [Layout Types](#layout-types)
- [Configuration Priority](#configuration-priority)

---

## Basic Front Matter

Every post starts with YAML front matter at the top of the file:

```yaml
---
title: Your Post Title
date: 2025-11-08 13:27:21
categories: blogs
tags:
  - python
  - tutorial
layout: post
---
```

### Required Fields
- **title**: Post title (required)
- **date**: Publication date (required)

### Common Fields
- **categories**: Single category or list of categories
- **tags**: List of tags
- **layout**: Template type (`post`, `page`, etc.)
- **comments**: Enable/disable comments (true/false)
- **excerpt**: Custom excerpt text

---

## Visual Content

### Cover Image
Add a full-width cover image to your post:

```yaml
---
title: My Post
cover: /gallery/covers/my-cover.jpg
---
```

### Thumbnail
Set a thumbnail for archive pages and widgets:

```yaml
---
title: My Post
thumbnail: /gallery/thumbnails/my-thumb.jpg
---
```

**Important**: Use absolute paths from the `source/` directory:
- ✅ `/img/photo.jpg` → `source/img/photo.jpg`
- ❌ `../img/photo.jpg`

---

## Code Highlighting

### Global Settings (in `_config.icarus.yml`)
```yaml
article:
  highlight:
    theme: atom-one-light  # or atom-one-dark, github, monokai, etc.
    clipboard: true        # Show copy button
    fold: unfolded         # "", "folded", or "unfolded"
```

### Per-Post Override
Override code theme for a specific post:

```yaml
---
title: My Technical Post
article:
  highlight:
    theme: atom-one-dark
    fold: folded
---
```

### Fold Individual Code Blocks
Use special syntax in your markdown:

````markdown
{% codeblock "optional-filename.py" lang:python >folded %}
def hello():
    print("This code block is folded by default")
{% endcodeblock %}
````

**Available Themes**: Browse [highlight.js themes](https://github.com/highlightjs/highlight.js/tree/master/src/styles)

---

## Time Display

### Read Time
Show estimated reading time (enabled globally by default):

```yaml
article:
  readtime: true
```

### Update Time
Show when the post was last updated:

```yaml
---
title: My Post
updated: 2025-11-10 15:30:00
---
```

Control update time display globally:
```yaml
article:
  update_time: true   # Always show
  # update_time: false  # Never show
  # update_time: auto   # Show only if different from publish date
```

---

## Table of Contents

### Enable TOC for a Post
```yaml
---
title: My Long Post
toc: true
---
```

### TOC Widget Settings (in `_config.icarus.yml`)
```yaml
widgets:
  -
    position: left
    type: toc
    index: true       # Show heading numbers
    collapsed: true   # Collapse sub-headings when out of view
    depth: 3          # Maximum heading level (1-6)
```

**Note**: On post pages, only the TOC widget is shown in the left sidebar (custom modification).

---

## Sidebar Widgets

### Current Configuration
- **Post pages**: Left sidebar with TOC only
- **Other pages**: Full left sidebar (profile, TOC) + right sidebar (categories, tags, etc.)

### Override Widgets Per Post
You can customize widgets in the front matter, but this is rarely needed:

```yaml
---
title: My Post
sidebar:
  left:
    sticky: true
---
```

---

## SEO & Social Media

### Open Graph (Facebook, LinkedIn, etc.)
```yaml
---
title: My Post
head:
  open_graph:
    type: article
    image: /img/social-share.jpg
    description: Custom description for social media
---
```

### Twitter Card
```yaml
---
title: My Post
head:
  open_graph:
    twitter_card: summary_large_image
---
```

### Google Structured Data
```yaml
---
title: My Post
head:
  structured_data:
    description: Custom description for search engines
    image: /img/seo-image.jpg
---
```

**Tip**: Usually, you should leave these blank in global config and set them per-post as needed.

---

## Custom Settings

### Article Licensing
Override the default license for a specific post:

```yaml
---
title: My Post
article:
  licenses:
    MIT License:
      icon: fab fa-osi
      url: https://opensource.org/licenses/MIT
---
```

### Custom Meta Tags
Add custom HTML meta tags:

```yaml
---
title: My Post
head:
  meta:
    - 'name=keywords;content=python,tutorial,data science'
    - 'name=author;content=Your Name'
---
```

---

## Layout Types

### Available Layouts

1. **`post`** (default for posts in `source/_posts/`)
   - Full blog post with TOC in left sidebar only
   - All article features enabled

2. **`page`** (default for custom pages)
   - Static page layout
   - Can customize sidebar widgets

3. **`blogs`** (custom layout)
   - Shows all posts with "blogs" category/tag
   - Used for `/blogs/` landing page

4. **`photography`** (custom layout)
   - Shows all posts with "photography" category/tag
   - Used for `/photography/` landing page

5. **`life`** (custom layout)
   - Shows all posts with "life" category/tag
   - Used for `/life/` landing page

6. **`category`** (built-in)
   - Shows posts in a specific category
   - Includes breadcrumb navigation

7. **`archive`** (built-in)
   - Shows posts grouped by date
   - Timeline view

### Creating Custom Section Layouts

To create a new section (e.g., "travel"):

1. Create `themes/icarus/layout/travel.jsx`:
```jsx
const { Component } = require('inferno');
const CategoryPosts = require('./common/category-posts');

module.exports = class extends Component {
    render() {
        const { site, helper, config, page } = this.props;
        return <CategoryPosts 
            site={site}
            helper={helper}
            config={config}
            categoryName="travel"
            emptyMessage="No travel posts yet."
        />;
    }
};
```

2. Create `source/travel/index.md`:
```markdown
---
title: Travel
layout: travel
---
```

3. Create posts with `categories: travel`

---

## Configuration Priority

Configuration sources are applied in this order (highest to lowest priority):

### For a Specific Post/Page:
1. **Post front matter** (this file) - highest priority
2. Layout config (`_config.post.yml` or `_config.page.yml`)
3. Theme config (`_config.icarus.yml`)
4. Site config (`_config.yml`) - lowest priority

### Example:
If you set `article.highlight.theme` in all four places:
```yaml
# In your post front matter (WINS!)
article:
  highlight:
    theme: monokai-sublime
```

The post will use `monokai-sublime` theme, ignoring all other settings.

---

## Quick Reference Examples

### Minimal Blog Post
```yaml
---
title: Quick Tutorial
date: 2025-11-08 10:00:00
categories: blogs
tags:
  - tutorial
---

Your content here...
```

### Full-Featured Post
```yaml
---
title: Complete Guide to Python
date: 2025-11-08 10:00:00
updated: 2025-11-09 15:30:00
categories: blogs
tags:
  - python
  - tutorial
  - advanced
cover: /img/python-guide-cover.jpg
thumbnail: /img/python-guide-thumb.jpg
toc: true
layout: post
article:
  highlight:
    theme: atom-one-dark
    fold: unfolded
head:
  open_graph:
    image: /img/python-social.jpg
    description: A comprehensive guide to Python programming
---

Your content here...
```

### Photography Post
```yaml
---
title: Mountain Photography
date: 2025-11-08 10:00:00
categories: photography
tags:
  - landscape
  - nature
cover: /gallery/mountains/hero.jpg
thumbnail: /gallery/mountains/thumb.jpg
toc: false
---

![Mountain sunset](/gallery/mountains/sunset.jpg)
```

---

## Custom Theme Modifications

Your theme has been customized with these features:

### 1. Post Layout
- **Left sidebar**: Shows TOC widget only
- **Right sidebar**: Hidden on post pages
- **Main content**: Wider (75% on desktop) for better readability

### 2. Sticky Sidebar
- Left sidebar is sticky (scrolls with page)
- Configured in `_config.icarus.yml`:
```yaml
sidebar:
  left:
    sticky: true
```

### 3. Category Section Layouts
Custom layouts for filtering posts by category:
- `blogs.jsx` - Shows posts tagged/categorized as "blogs"
- `photography.jsx` - Shows posts tagged/categorized as "photography"  
- `life.jsx` - Shows posts tagged/categorized as "life"

All use the shared `common/category-posts.jsx` component.

---

## Tips & Best Practices

1. **Images**: Store in `source/img/` or organized subdirectories
2. **Paths**: Always use absolute paths starting with `/`
3. **Categories**: Use singular form (`blog` not `blogs`)
4. **Tags**: Use lowercase, hyphenated (`machine-learning` not `Machine Learning`)
5. **TOC**: Works best with 2-4 heading levels (##, ###, ####)
6. **Dates**: Use consistent format: `YYYY-MM-DD HH:MM:SS`
7. **Excerpts**: Use `<!-- more -->` tag to control excerpt length
8. **Testing**: Run `hexo clean && hexo generate` after config changes

---

## Common Issues

### TOC Not Showing
- Ensure `toc: true` in front matter
- Check that you have headings (##, ###) in your post
- Verify TOC widget is configured in `_config.icarus.yml`

### Cover Image Not Loading
- Check file exists in `source/` directory
- Use absolute path: `/img/cover.jpg` not `img/cover.jpg`
- Clear cache: `hexo clean`

### Code Highlighting Issues
- Check theme name spelling
- Browse available themes in highlight.js repo
- Clear cache after changes

---

## Resources

- [Hexo Documentation](https://hexo.io/docs/)
- [Icarus Theme Guide](https://ppoffice.github.io/hexo-theme-icarus/)
- [Highlight.js Themes](https://github.com/highlightjs/highlight.js/tree/master/src/styles)
- [FontAwesome Icons](https://fontawesome.com/icons)
- [Markdown Syntax](https://www.markdownguide.org/basic-syntax/)

---

**Last Updated**: November 8, 2025
