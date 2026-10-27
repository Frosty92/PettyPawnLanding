// A contact sheet: every Nth frame of a take list, small, in a grid, with its time. usage: sheet <list.txt> <out.jpg> <every-seconds>
import AppKit
let a = CommandLine.arguments
let files = try! String(contentsOfFile: a[1], encoding: .utf8).split(separator: "\n").map(String.init)
let step = Int(Double(a[3])! * 30)
let picks = stride(from: 0, to: files.count, by: step).map { ($0, files[$0]) }
let tw = 195, th = 422, cols = 6
let rows = (picks.count + cols - 1) / cols
let W = tw * cols, H = (th + 18) * rows
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
for (i, (n, f)) in picks.enumerated() {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: f) as CFURL, nil)!
  let img = CGImageSourceCreateImageAtIndex(src, 0, nil)!
  let x = (i % cols) * tw, y = H - (i / cols + 1) * (th + 18)
  ctx.draw(img, in: CGRect(x: x, y: y, width: tw, height: th))
  (String(format: "%.1fs", Double(n) / 30) as NSString).draw(at: NSPoint(x: x + 4, y: y + th + 2), withAttributes: [.font: NSFont.systemFont(ofSize: 12), .foregroundColor: NSColor.black])
}
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.7])!.write(to: URL(fileURLWithPath: a[2]))
