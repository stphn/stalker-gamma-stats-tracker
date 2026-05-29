"""
Real-ESRGAN x4plus inference via ONNX Runtime.
Handles arbitrary image sizes by tiling with overlap blending.

Usage: python esrgan_infer.py <model.onnx> <input.png> <output.png>
"""
import sys, math
import numpy as np
from PIL import Image
import onnxruntime as ort

TILE   = 512   # tile size fed to the model
OVERLAP = 32   # px overlap between tiles (blended to avoid seams)
SCALE  = 4

def load_session(model_path):
    # Try GPU providers in preference order; fall back to CPU
    for ep in [['DmlExecutionProvider'], ['CUDAExecutionProvider'], ['CPUExecutionProvider']]:
        try:
            sess = ort.InferenceSession(model_path, providers=ep)
            print(f"  Using: {sess.get_providers()[0]}", flush=True)
            return sess
        except Exception:
            continue
    raise RuntimeError("No working ONNX execution provider found")

def run_tile(sess, tile_rgb):
    """Run model on a single tile (HWC uint8) → upscaled HWC uint8."""
    inp_name = sess.get_inputs()[0].name
    x = tile_rgb.astype(np.float32) / 255.0        # normalise [0,1]
    x = x.transpose(2, 0, 1)[np.newaxis]           # NCHW
    y = sess.run(None, {inp_name: x})[0]            # NCHW out
    y = y[0].transpose(1, 2, 0)                    # HWC
    return np.clip(y * 255, 0, 255).astype(np.uint8)

def upscale(model_path, src, dst):
    sess = load_session(model_path)
    img  = np.array(Image.open(src).convert("RGB"))
    h, w = img.shape[:2]
    print(f"  Input: {w}×{h}", flush=True)

    out_h, out_w = h * SCALE, w * SCALE
    acc = np.zeros((out_h, out_w, 3), dtype=np.float64)
    wgt = np.zeros((out_h, out_w, 1), dtype=np.float64)

    step = TILE - OVERLAP
    ys = list(range(0, h, step)); ys[-1] = max(0, h - TILE)
    xs = list(range(0, w, step)); xs[-1] = max(0, w - TILE)

    total = len(ys) * len(xs)
    done  = 0
    for y in ys:
        for x in xs:
            x2, y2 = min(x + TILE, w), min(y + TILE, h)
            tile = img[y:y2, x:x2]
            up   = run_tile(sess, tile).astype(np.float64)
            oy, ox = y * SCALE, x * SCALE
            uh, uw = up.shape[:2]
            acc[oy:oy+uh, ox:ox+uw] += up
            wgt[oy:oy+uh, ox:ox+uw] += 1.0
            done += 1
            print(f"  tile {done}/{total}", end="\r", flush=True)

    result = np.clip(acc / wgt, 0, 255).astype(np.uint8)
    Image.fromarray(result).save(dst)
    print(f"\n  Output: {out_w}×{out_h}  →  {dst}", flush=True)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python esrgan_infer.py model.onnx input.png output.png")
        sys.exit(1)
    upscale(sys.argv[1], sys.argv[2], sys.argv[3])
