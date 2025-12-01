---
marp: true
theme: default
style: |
  /* Title slide with background image and centered overlay box */
  section.title {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
  }
  section.title .title-content {
    background: rgba(255, 255, 255, 0.95);
    padding: 60px 80px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 800px;
    backdrop-filter: blur(10px);
  }
  section.title.dark .title-content {
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
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
  
  /* Full-width header layout - header spans entire width, image positioned absolutely */
  .full-width-header {
    position: relative;
  }
  .full-width-header h1 {
    width: 100%;
    margin-bottom: 20px;
  }
  .full-width-header img {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    max-height: 60%;
    max-width: 300px;
  }
  
  /* Two-column grid layout - FIXED */
  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
  }
  .two-column > div {
    min-height: 100px;
  }
  
  /* Image-left, text-right layout */
  .image-left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
  }
  .image-left img {
    width: 100%;
    height: auto;
  }
  
  /* Image-right, text-left layout */
  .image-right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
  }
  .image-right img {
    width: 100%;
    height: auto;
  }
  
  /* Three-column grid layout */
  .three-column {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 30px;
    align-items: start;
  }
  .three-column > div {
    min-height: 100px;
  }
  
  /* Centered title slide */
  .title-slide {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
  }
  .title-slide h1 {
    font-size: 3em;
    margin-bottom: 0.5em;
  }
  .title-slide h2 {
    font-size: 1.8em;
    font-weight: 300;
    opacity: 0.8;
  }
  
  /* Section divider - simple centered text */
  .section-divider {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
  }
  .section-divider h1 {
    font-size: 3.5em;
    margin: 0;
  }
  .section-divider p {
    font-size: 1.3em;
    margin-top: 0.5em;
    opacity: 0.7;
  }
  
  /* Centered quote layout */
  .quote {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
  }
  .quote blockquote {
    font-size: 2em;
    font-style: italic;
    margin: 0 0 1em 0;
    max-width: 80%;
  }
  .quote cite {
    font-size: 1.2em;
    opacity: 0.7;
  }
  
  /* Big number/stat display */
  .big-stat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
  }
  .big-stat .number {
    font-size: 6em;
    font-weight: 700;
    line-height: 1;
    margin: 0;
  }
  .big-stat .caption {
    font-size: 1.5em;
    margin-top: 0.5em;
    opacity: 0.8;
  }
  
  /* Image with caption */
  .image-caption {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .image-caption img {
    max-height: 70%;
    max-width: 90%;
  }
  .image-caption figcaption {
    margin-top: 1em;
    font-style: italic;
    opacity: 0.8;
  }
  
  /* Full-screen image - no text, just image */
  .full-image {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .full-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .full-image h1,
  .full-image h2,
  .full-image h3,
  .full-image p {
    display: none;
  }
---

<!-- layout: title -->
<!-- image-friendly: true -->
<!-- _class: title -->
<!-- _backgroundImage: url('images/placeholder-landscape.png') -->

<div class="title-content">

# Your Presentation Title

## Subtitle or tagline goes here

</div>

---

<!-- layout: full-width-header -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 4:3 -->
<!-- image-position: right-side -->
<!-- description: Full-width header with image on right - headline spans full width -->
<!-- _class: full-width-header -->

# Full-Width Header Layout

This layout ensures the headline spans the entire width of the slide, even when an image is positioned on the right. The image is positioned absolutely and won't compress the header text.

Use this layout when you want a prominent headline with a supporting image.

![](images/placeholder-square.png)

---

<!-- layout: two-column -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 9:16 -->
<!-- image-position: left-or-right-column -->
<!-- description: Two-column grid - ideal for side-by-side content or vertical images -->
<!-- _class: two-column -->

# Two-Column Layout

<div class="two-column">
<div>

## Left Column

- Point one
- Point two
- Point three

</div>
<div>

## Right Column

- Additional details
- Supporting information
- Related content

</div>
</div>

---

<!-- layout: image-left -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 9:16 -->
<!-- image-position: left-half -->
<!-- description: Image on left half, content on right half -->
<!-- _class: image-left -->

# Image Left, Text Right

<div class="image-left">
<div>

![](images/placeholder-portrait.png)

</div>
<div>

## Content Here

This layout places an image on the left and your content on the right. Perfect for vertical/portrait-oriented images.

- Key point one
- Key point two
- Key point three

</div>
</div>

---

<!-- layout: image-right -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 9:16 -->
<!-- image-position: right-half -->
<!-- description: Content on left half, image on right half -->
<!-- _class: image-right -->

# Text Left, Image Right

<div class="image-right">
<div>

## Content Here

This layout places your content on the left and an image on the right. Perfect for vertical/portrait-oriented images.

- Key point one
- Key point two
- Key point three

</div>
<div>

![](images/placeholder-portrait.png)

</div>
</div>

---

<!-- layout: three-column -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 9:16 -->
<!-- image-position: any-column -->
<!-- description: Three-column grid - ideal for comparisons or multiple items -->
<!-- _class: three-column -->

# Three-Column Layout

<div class="three-column">
<div>

## Column 1

- First item
- Details here

</div>
<div>

## Column 2

- Second item
- More details

</div>
<div>

## Column 3

- Third item
- Additional info

</div>
</div>

---

<!-- layout: title-slide -->
<!-- image-friendly: false -->
<!-- description: Centered title slide for section breaks or presentation start -->
<!-- _class: title-slide -->

# Presentation Title

## Subtitle or Author Name

---

<!-- layout: section-divider -->
<!-- image-friendly: false -->
<!-- description: Simple centered section divider for breaking up presentation -->
<!-- _class: section-divider -->

# Section Name

Optional subtitle or context

---

<!-- layout: quote -->
<!-- image-friendly: false -->
<!-- description: Centered quote layout with attribution -->
<!-- _class: quote -->

<blockquote>
"The best way to predict the future is to invent it."
</blockquote>

<cite>— Alan Kay</cite>

---

<!-- layout: big-stat -->
<!-- image-friendly: false -->
<!-- description: Large centered number/statistic with caption - perfect for KPIs -->
<!-- _class: big-stat -->

<div class="big-stat">
<div class="number">42%</div>
<div class="caption">Growth Year over Year</div>
</div>

---

<!-- layout: image-caption -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 16:9 -->
<!-- image-position: center -->
<!-- description: Large centered image with caption - ideal for landscape/wide images -->
<!-- _class: image-caption -->

# Image with Caption

<figure>

![](images/placeholder-landscape.png)

<figcaption>Figure 1: Description of the image content</figcaption>

</figure>

---

<!-- layout: full-image -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: any -->
<!-- image-position: full-screen -->
<!-- description: Full-screen image only - no text, perfect for impactful visuals -->
<!-- _class: full-image -->

![](images/placeholder-square.png)

---

<!-- layout: standard -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 16:9 -->
<!-- image-position: inline -->
<!-- description: Standard content slide - images flow inline with text -->

# Standard Content Slide

This is a standard slide layout with a headline and content below.

- Bullet point one
- Bullet point two
- Bullet point three

You can include regular content, lists, and images in the normal flow.


