---
marp: true
theme: default
style: |
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
  
  /* Two-column grid layout */
  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
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
---

<!-- layout: full-width-header -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 4:3 -->
<!-- image-position: right-side -->
<!-- _class: full-width-header -->

# Full-Width Header Layout

This layout ensures the headline spans the entire width of the slide, even when an image is positioned on the right. The image is positioned absolutely and won't compress the header text.

Use this layout when you want a prominent headline with a supporting image.

![](https://via.placeholder.com/300x200)

---

<!-- layout: two-column -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 9:16 -->
<!-- image-position: left-or-right-column -->
<!-- description: Two-column grid - ideal for vertical/portrait images on one side, text on the other -->

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

<!-- layout: title-slide -->
<!-- image-friendly: false -->
<!-- description: Centered title slide for section breaks or presentation start -->
<!-- _class: title-slide -->

# Presentation Title

## Subtitle or Author Name

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

<!-- layout: image-caption -->
<!-- image-friendly: true -->
<!-- recommended-aspect-ratio: 16:9 -->
<!-- image-position: center -->
<!-- description: Large centered image with caption - ideal for landscape/wide images -->
<!-- _class: image-caption -->

# Image with Caption

<figure>

![](https://via.placeholder.com/600x400)

<figcaption>Figure 1: Description of the image content</figcaption>

</figure>

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


