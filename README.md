# JavascriptAndGraphics

Repo to use AI to go over 2 Javascript books:
- JavaScript: The Comprehensive Guide to Learning Professional JavaScript Programming
- Modern JavaScript for the Impatient

As I go through the chapters, we will do small graphics projects on WebGPU showcasing the new topics and getting familiar with the API.

## Projects

### 1. Rotating 3D Cube (WebGPU)

A simple WebGPU application that renders a rotating 3D cube with colored vertices.

**Topics covered:**
- WebGPU API initialization
- Vertex and fragment shaders (WGSL)
- 3D transformations (model, view, projection matrices)
- Animation loops with requestAnimationFrame
- GPU buffers (vertex, index, uniform)
- Render pipelines and depth testing

**How to run:**
1. Open `index.html` in a WebGPU-supported browser (Chrome 113+, Edge 113+)
2. The cube should automatically start rotating

**Note:** WebGPU requires a modern browser with WebGPU support enabled. If your browser doesn't support WebGPU, you'll see an error message.

## Browser Requirements

- Chrome 113+ or Edge 113+ with WebGPU support
- For older browsers, you may need to enable WebGPU in flags:
  - Chrome/Edge: `chrome://flags/#enable-unsafe-webgpu`
