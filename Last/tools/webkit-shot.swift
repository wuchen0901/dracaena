// 用 macOS 自带的 WebKit（和 iPhone 上的 Safari、App 里的网页是同一个引擎）打开一张画面图页面（Last/tools/*-sheet.html），
// 等页面把 window.__sheetDone 设成 true，再把页面上那张 #sheet 画布存成 PNG。不用手机、不用装别的东西，就能看到 iPhone 引擎画出来的样子。
// 用法：swift Last/tools/webkit-shot.swift <网址> <输出.png> [最长等待秒数=150]
// 例子：swift Last/tools/webkit-shot.swift "http://127.0.0.1:8765/tools/air-sheet.html?layout=full&shot=7b&air=0&fx=0" generated_images/xxx.png
// 注意：Mac 上的 WebKit 和 iPhone 一样没有画布的 ctx.filter（2026-11-13 实测），所以拿它来查 iPhone 上的柔边很合适；帧率要在真手机上量（tools/phone-check.html）。
import AppKit
import WebKit

let args = CommandLine.arguments
guard args.count >= 3 else { print("用法：swift webkit-shot.swift <网址> <输出.png> [最长等待秒数]"); exit(2) }
let out = args[2], maxSec = args.count > 3 ? Double(args[3]) ?? 150 : 150
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1920, height: 1080), styleMask: [.borderless], backing: .buffered, defer: false)
let web = WKWebView(frame: win.contentView!.bounds, configuration: WKWebViewConfiguration())
win.contentView!.addSubview(web); win.orderBack(nil)
let t0 = Date()
func poll() {
  web.evaluateJavaScript("window.__sheetDone === true ? (document.getElementById('sheet') ? document.getElementById('sheet').toDataURL('image/png') : 'no-sheet') : null") { v, _ in
    if let s = v as? String {
      if s == "no-sheet" { print("页面上没有 #sheet 画布"); exit(1) }
      if let comma = s.firstIndex(of: ","), let data = Data(base64Encoded: String(s[s.index(after: comma)...])) {
        do { try data.write(to: URL(fileURLWithPath: out)) } catch { print("写不了文件：\(error)"); exit(1) }
        print("完成：\(out)（\(Int(Date().timeIntervalSince(t0))) 秒）"); exit(0)
      }
    }
    if Date().timeIntervalSince(t0) > maxSec { print("等了 \(Int(maxSec)) 秒，页面还没画完"); exit(1) }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: poll)
  }
}
web.load(URLRequest(url: URL(string: args[1])!))
DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: poll)
app.run()
