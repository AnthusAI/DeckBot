---
marp: true
theme: default
size: 16:9
paginate: true
backgroundColor: #0A0A0A
color: #F2F2F2
style: |
  section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    background-color: #0A0A0A;
    color: #F2F2F2;
    font-size: 24px;
    padding: 60px;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-weight: 700;
    color: #F2F2F2;
  }
  
  h1 {
    font-size: 60px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 42px;
    color: #66BB6A;
    margin-bottom: 16px;
  }
  
  h2::before {
    content: '> ';
    color: #66BB6A;
  }
  
  a {
    color: #66BB6A;
    text-decoration: underline;
  }
  
  strong {
    color: #FFDD33;
    font-weight: 700;
  }
  
  blockquote {
    border-left: 4px solid #66BB6A;
    padding-left: 20px;
    font-style: normal;
    color: #66BB6A;
  }
  
  code {
    background-color: #1A1A1A;
    color: #FFDD33;
    padding: 3px 8px;
    border-radius: 3px;
    font-family: 'Courier New', 'Consolas', monospace;
  }
  
  pre {
    background-color: #1A1A1A;
    border: 1px solid #66BB6A;
    padding: 20px;
    border-radius: 4px;
  }  
  /* Title slide with background image and centered overlay box */
  section.title {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
  }
  section.title .title-content {
    background: rgba(10, 10, 10, 0.90);
    padding: 60px 80px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    text-align: center;
    max-width: 800px;
    backdrop-filter: blur(10px);
  }
  section.title h1 {
    font-size: 3em;
    margin: 0 0 0.3em 0;
    line-height: 1.2;
  }
  section.title h2 {
    font-size: 1.5em;
    font-weight: 300;
    margin: 0;
    opacity: 0.85;
  }
---

<!-- _class: title -->
<!-- _backgroundImage: url('images/placeholder-landscape-dark.png') -->

<div class="title-content">

# Terminal Chic

## $ echo "Developer-friendly dark theme"

</div>

---

## System Fonts

- **System UI** for native performance
- *Segoe UI* for cross-platform consistency
- Terminal-inspired aesthetic

---

## Classic Terminal Colors

**Green** (#66BB6A) for success
**Yellow** (#FFDD33) for warnings

> `$ whoami` — A developer's presentation theme

---

# Ready to Deploy

```bash
presentation.start()
# Let's build something great
```


---

<!-- _class: image-left -->

# Image Left Layout

<div class="image-left">
<div>

![](images/placeholder-portrait-dark.png)

</div>
<div>

## Portrait images (9:16)

Perfect for vertical content

</div>
</div>

---

<!-- _class: two-column -->

# Two-Column Layout

<div class="two-column">
<div>

![](images/placeholder-portrait-dark.png)

## Left

</div>
<div>

![](images/placeholder-portrait-dark.png)

## Right

</div>
</div>

---

<!-- _class: full-image -->

![](images/placeholder-square-dark.png)

