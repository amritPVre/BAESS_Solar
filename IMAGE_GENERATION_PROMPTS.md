# Background Image Generation Prompts for Dashboard Cards

## Image Specifications
- **Dimensions**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG (optimized for web)
- **File Size**: Keep under 200KB for fast loading
- **Optimization**: Use compression tools like TinyJPG or ImageOptim after generation

---

## 1. PV AI Designer Pro Background (`pv-designer-bg.jpg`)

### Primary Prompt:
```
Abstract futuristic solar panel background, soft focus blue and purple gradient, 
modern technology aesthetic, floating geometric circuit patterns, holographic 
digital interface elements, photovoltaic cells in soft blur, neural network 
connections, AI visualization, clean minimalist design, depth of field effect, 
professional tech background, subtle light rays, glass reflection effect, 
high-tech atmosphere, 8k quality, soft bokeh
```

### Alternative Prompt 1 (Minimal):
```
Blurred solar panel texture with blue to indigo gradient overlay, abstract 
technology background, soft focus, minimal design, digital wireframe elements, 
clean and professional, subtle geometric patterns, modern tech aesthetic, 
depth blur, light particles floating
```

### Alternative Prompt 2 (Futuristic):
```
Futuristic solar energy visualization, abstract blue purple cyan gradient, 
AI neural network overlay, soft bokeh effect, digital hologram interface, 
photovoltaic technology concept, glass morphism ready, clean background, 
professional tech design, depth of field, light rays, 3D render quality
```

### Color Palette:
- Primary: Blue (#3B82F6)
- Secondary: Indigo (#6366F1)
- Accent: Purple (#8B5CF6)
- Highlights: Cyan (#06B6D4)

---

## 2. AI BOQ Generator Background (`boq-generator-bg.jpg`)

### Primary Prompt:
```
Abstract professional document and data visualization background, soft focus 
emerald teal cyan gradient, floating digital spreadsheet elements, 
architectural blueprint patterns in blur, holographic financial charts, 
AI calculation interface, modern business tech aesthetic, clean minimalist 
design, depth of field effect, glass reflection, subtle grid patterns, 
professional accounting atmosphere, 8k quality, soft bokeh
```

### Alternative Prompt 1 (Business):
```
Blurred financial document texture with emerald to teal gradient overlay, 
abstract business technology background, soft focus spreadsheet elements, 
minimal design, digital graph lines, clean and professional, subtle geometric 
grid, modern accounting aesthetic, depth blur, light particles
```

### Alternative Prompt 2 (Technical):
```
Futuristic bill of quantities interface, abstract emerald teal cyan gradient, 
AI calculation visualization, soft bokeh effect, digital hologram spreadsheet, 
construction cost estimation concept, glass morphism ready, clean background, 
professional business tech design, depth of field, data visualization, 
3D render quality
```

### Color Palette:
- Primary: Emerald (#10B981)
- Secondary: Teal (#14B8A6)
- Accent: Cyan (#06B6D4)
- Highlights: Mint (#6EE7B7)

---

## Design Guidelines

### Do's:
✅ Keep the images **abstract and blurred**
✅ Use **soft gradients** matching the color palettes
✅ Include **subtle geometric/tech elements**
✅ Maintain **depth of field** for glass effect compatibility
✅ Keep backgrounds **light to medium** tone (30-50% opacity will be applied)
✅ Use **bokeh effects** for professional look
✅ Ensure **minimal visual noise** for text readability

### Don'ts:
❌ Avoid sharp, detailed imagery that competes with text
❌ Don't use dark or high-contrast images
❌ Avoid busy patterns that reduce readability
❌ Don't include recognizable objects or text
❌ Avoid images with strong focal points
❌ Don't use images larger than 500KB

---

## Optimization Steps After Generation

1. **Resize**: Scale to 1200x800px if larger
2. **Compress**: Use TinyJPG.com or similar (target: <200KB)
3. **Format**: Save as JPG with 75-85% quality
4. **Test**: Preview with glass morphism overlay
5. **Adjust**: If needed, increase blur or reduce opacity in Photoshop/GIMP

---

## Recommended AI Image Generation Tools

1. **Midjourney** (Best quality)
   - Add `--ar 3:2 --style raw --q 2` to prompts
   
2. **DALL-E 3** (via ChatGPT Plus)
   - Copy prompts directly, specify "abstract background"
   
3. **Leonardo.ai** (Free tier available)
   - Use "Leonardo Diffusion XL" model
   - Enable "PhotoReal" mode
   
4. **Stable Diffusion** (via Clipdrop or DreamStudio)
   - Use "abstract" and "soft focus" in negative prompt

---

## File Placement

After generating and optimizing the images:

1. Save as:
   - `pv-designer-bg.jpg.png` (PNG format recommended)
   - `boq-generator-bg.jpg.png` (PNG format recommended)

2. Place in:
   - `public/` folder (same location as your logo files)

3. The code already references:
   - `/pv-designer-bg.jpg.png`
   - `/boq-generator-bg.jpg.png`

**Note**: PNG format is recommended for better quality with transparency support, even though the file name includes `.jpg.png` extension.

---

## Testing

After adding images:
1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check page load speed (should be <2 seconds)
3. Verify text readability on cards
4. Test hover effects work smoothly
5. Check on mobile devices

---

## Quick Alternative: Stock Photos

If you prefer using stock photos, search for:
- "abstract technology background blue gradient"
- "soft focus solar panel texture"
- "blurred business document teal gradient"

**Recommended Sites**:
- Unsplash.com (free, high quality)
- Pexels.com (free)
- Pixabay.com (free)

Remember to blur/process stock photos to work with glass morphism!

