// Encode a list of JPEG frames (one per line, at a constant rate) into an H.264 MP4.
// usage: swift encode.swift <list.txt> <out.mp4> <fps> <bitrate>
import AVFoundation
import AppKit

let args = CommandLine.arguments
let files = try! String(contentsOfFile: args[1], encoding: .utf8).split(separator: "\n").map(String.init)
let out = URL(fileURLWithPath: args[2])
let fps = Int32(args[3])!
let bitrate = Int(args[4])!
try? FileManager.default.removeItem(at: out)

func cgImage(_ path: String) -> CGImage {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
let first = cgImage(files[0])
let w = first.width & ~1, h = first.height & ~1

let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: h,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel, AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
])
writer.add(input)
writer.shouldOptimizeForNetworkUse = true
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var cache: (String, CVPixelBuffer)? = nil
for (i, file) in files.enumerated() {
  while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
  var buffer: CVPixelBuffer
  if let c = cache, c.0 == file { buffer = c.1 } else {
    var pb: CVPixelBuffer? = nil
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
    buffer = pb!
    CVPixelBufferLockBaseAddress(buffer, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buffer), width: w, height: h, bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer), space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
    ctx.draw(cgImage(file), in: CGRect(x: 0, y: 0, width: w, height: h))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    cache = (file, buffer)
  }
  adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
print(writer.status == .completed ? "wrote \(args[2]) \(w)x\(h) \(files.count) frames" : "failed: \(String(describing: writer.error))")
