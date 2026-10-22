# Kế Hoạch Thiết Kế: "The Life of a Screen" — Câu Chuyện Cuộn Trang Cho Viewixsoft

Tài liệu này tổng hợp toàn bộ định hướng thiết kế lại (redesign), kịch bản phân cảnh (storyboard), kiến trúc kỹ thuật và các tùy chọn thị giác cho trang chủ Viewixsoft theo phong cách **"The Life of a Screen" (Cuộc Đời Của Một Chiếc Màn Hình)**.

---

## 1. Vấn Đề Cần Giải Quyết

Giao diện trước đây mang phong cách SaaS khuôn mẫu thường thấy từ AI:
* Nền slate đen kết hợp xanh cyan phát sáng (glow shadows).
* Khối kính mờ (glassmorphism), bento grid lặp lại.
* Hero căn giữa với 2 nút bấm, logo cloud, danh sách số liệu, thẻ đánh giá (testimonials) và một dải CTA dưới cùng.

**Định hướng mới:** Xóa bỏ hoàn toàn phong cách cũ. Giữ nguyên hạ tầng dữ liệu, routing của TanStack Start và hệ thống SEO. Biến trang web thành **một câu chuyện liền mạch**, nơi **chiếc màn hình là nhân vật chính** xuyên suốt từ lúc bật nguồn đến khi trở thành một mạng lưới màn hình toàn cầu.

---

## 2. Kịch Bản Phân Cảnh Từng Chương (Storyboard Chi Tiết)

Trang chủ gồm 7 phân cảnh chính (Chương 0 đến 6). Mỗi chương là một phân cảnh ghim cố định (`position: sticky`, chiều dài cuộn khoảng 180vh–220vh trên desktop, khoảng 110vh trên mobile), nội dung dịch chuyển theo thanh cuộn đóng vai trò như một thanh phát (playhead timeline).

```
[Tiến độ cuộn: 0%]                  [Tiến độ cuộn: 50%]                 [Tiến độ cuộn: 100%]
--------------------------------------------------------------------------------------------
CH 0: Phòng tối, quét CRT           → Bắt tín hiệu 4K, hiện Viewixsoft   → Màn hình ổn định, chuẩn bị cuộn
CH 1: 1 màn hình đơn độc            → Tách thành 4, rồi 16 màn hình      → Bức tường 40 màn hình lỗi/lệch pha
CH 2: Cảnh hỗn loạn đóng băng       → Con trỏ kéo thả video vào timeline → Sóng đồng bộ quét qua, tất cả đồng nhất
CH 3: Zoom vào bảng menu nhà hàng   → Máy POS in hóa đơn, giá bay lên    → Bảng menu nhảy giá tức thì (<250ms)
CH 4: Màn hình quảng cáo ưu đãi     → Điện thoại tiến lại gần chạm NFC   → Sóng NFC phát ra, vé ưu đãi mở trên điện thoại
CH 5: Góc nhìn lùi xa toàn cảnh     → Màn hình thu nhỏ thành chấm trên bản đồ → Bản đồ thế giới nhấp nháy + log chứng thực
CH 6: Mạng lưới thu về màn hình đầu → Dòng chữ "Your screen, next"       → Form đăng ký demo + sơ đồ gói giải pháp
```

---

### Chương 0: Bật Nguồn (Power On - Hero)
* **Tiêu đề H1:** `Viewixsoft: The Operating System for Every Screen on Earth`
* **Tóm tắt cốt lõi (dưới 25 từ):** *"Viewixsoft is the digital signage software platform that directs, monetizes, and monitors commercial displays worldwide with zero downtime."*
* **Bối cảnh:** Một căn phòng tối hoàn toàn. Chính giữa là một chiếc màn hình duy nhất với các vạch định vị chuẩn truyền hình (`⌜ ⌝ ⌞ ⌟`).
* **Diễn biến theo thanh cuộn:**
  * **0%:** Màn hình đen ngòm, đường quét scanline CRT mờ nhẹ chớp tắt, đèn LED báo trạng thái nhấp nháy đỏ.
  * **50%:** Vạch màu kiểm tra tín hiệu (SMPTE test bars) lóe lên trong 2 khung hình. Màn hình bừng sáng, dòng chữ `SIGNAL LOCK: 4K 60FPS` hiện lên bằng font monospace.
  * **100%:** Khung hình ổn định hoàn toàn, tiêu đề H1 và lời giới thiệu khóa nét sắc bén. Đồng hồ thời gian bắt đầu nhảy `CH 00 · 00:00:01`. Biểu tượng gợi ý cuộn nhẹ nhàng: `SCROLL TO BROADCAST ↓`.
* **Nút bấm hành động cố định:** Nút dạng viên thuốc nhỏ gọn ở góc màn hình: `[● LIVE] Book a demo →` (luôn hiển thị, không làm vướng mắt người đọc).

---

### Chương 1: Sự Cố — Màn Hình Nhân Lên Hỗn Loạn
* **Tiêu đề H2:** `What Happens When 1 Screen Becomes 100?`
* **Câu trả lời trực diện:** *"Without central orchestration, scaling a digital screen network leads to content drift, mismatched pricing, manual USB stick chaos, and silent display failures."*
* **Bối cảnh:** Chiếc màn hình từ Chương 0 bắt đầu phân rã.
* **Diễn biến:**
  * **0%:** Màn hình chính lùi nhẹ ra xa khi khung hình mở rộng.
  * **50%:** Màn hình nhân đôi thành 2×2 (4 màn hình), rồi tiếp tục nhân thành 4×4 (16 màn hình). Nội dung bắt đầu lệch pha: màn hình góc chiếu quảng cáo Giáng sinh giữa mùa hè, màn hình khác nhấp nháy icon `NO SIGNAL - CẮM USB`, màn hình bên cạnh hiển thị menu ăn sáng lúc 3 giờ chiều.
  * **100%:** Một bức tường 40 màn hình lệch pha hoàn toàn lấp kín tầm mắt. Màn hình trung tâm xuất hiện hiệu ứng giật sọc (glitch) với cảnh báo đỏ: `DRIFT DETECTED: 84% OUT OF SYNC`.
* **Nút chuyển hướng:** `Explore Viewixsoft CMS →`

---

### Chương 2: Viewixsoft CMS — Một Nơi Điều Khiển Mọi Màn Hình
* **Tiêu đề H2:** `How Do You Synchronize 1,000 Screens in Real Time?`
* **Câu trả lời trực diện:** *"Viewixsoft CMS lets marketing teams schedule playlists, target dynamic content by location and hour, and push updates across thousands of displays instantly."*
* **Bộ chuyển kênh (Channel Switcher):** Các nút bấm cho phép chuyển nhanh giữa các ngành: `[ Bán lẻ (Retail) ]`, `[ Nhà hàng (QSR) ]`, `[ Giao thông (Transit) ]`, `[ Biển quảng cáo ngoài trời (DOOH) ]`. Khi bấm, đồ họa trên các màn hình sẽ đổi tương ứng và có liên kết tới `/use-cases/$slug`.
* **Diễn biến:**
  * **0%:** Bức tường 40 màn hình hỗn loạn đóng băng lại. Một con trỏ điều khiển xuất hiện cùng file video chiến dịch mới (`"Summer Promo_4K.mp4"`).
  * **50%:** Con trỏ kéo thả video vào thanh timeline đa luồng. Một vòng xoay thời gian trong ngày quét từ `08:00 AM` (giờ cao điểm sáng) đến `08:00 PM` (buổi tối).
  * **100%:** Một luồng sóng phát sáng tỏa ra từ trung tâm. Từng màn hình trong bức tường 40 chiếc lập tức đồng bộ nội dung theo đúng lịch trình đã đặt. Nhãn trạng thái bật sáng xanh: `NETWORK SYNC: 100% · LATENCY <250MS`.
* **Nút chuyển hướng:** `Explore Viewixsoft CMS →`

---

### Chương 3: Viewixsoft POS — Giá Đổi Trên Quầy, Menu Đổi Theo Tức Thì
* **Tiêu đề H2:** `How Do Digital Menu Boards Stay in Sync with Cash Registers?`
* **Câu trả lời trực diện:** *"Viewixsoft POS binds point-of-sale registers directly to digital menu boards, updating prices, lunch-combos, and sold-out items within 250 milliseconds."*
* **Bộ chuyển kênh:** `[ Drive-thru ăn nhanh ]`, `[ Kệ hàng bán lẻ ]`, `[ Quầy bar & Lounge ]`.
* **Bối cảnh:** Bên trái là quầy thu ngân với máy POS cảm ứng và máy in bill nhiệt. Bên phải là màn hình menu điện tử cỡ lớn.
* **Diễn biến:**
  * **0%:** Máy quay zoom vào màn hình menu hiển thị giá cũ (`"Burger bò kép: $8.50"`).
  * **50%:** Thu ngân thao tác chỉnh giá trên máy POS. Giấy in hóa đơn chạy ra, dòng chữ `[CẬP NHẬT GIÁ COMBO: $9.20]` tách khỏi tờ bill và bay qua không gian 3D về phía màn hình.
  * **100%:** Khi thông tin chạm vào bảng menu, con số `$8.50` lập tức lật chuyển sang `$9.20` cực kỳ mượt mà. Nhãn kiểm tra hiện lên: `POS TELEMETRY: 0 DISCREPANCIES`.
* **Nút chuyển hướng:** `Explore Viewixsoft POS →`

---

### Chương 4: Viewixsoft NFC — Màn Hình Tương Tác Hai Chiều
* **Tiêu đề H2:** `Can Customers Interact with Signage Without Downloading an App?`
* **Câu trả lời trực diện:** *"Viewixsoft NFC turns passive billboard and kiosk screens into two-way engagement points, delivering instant mobile coupons, loyalty points, and product checkouts with a physical tap."*
* **Bộ chuyển kênh:** `[ Thời trang bán lẻ ]`, `[ Đặt vé sự kiện ]`, `[ Vé giao thông ]`.
* **Bối cảnh:** Màn hình tương tác trước cửa hàng và một bàn tay cầm điện thoại thông minh.
* **Diễn biến:**
  * **0%:** Màn hình giới thiệu sản phẩm mới cùng điểm chạm NFC phát sáng ở góc dưới.
  * **50%:** Bàn tay đưa điện thoại lại gần điểm chạm. Khi cách khoảng 2cm, một chuỗi vòng sóng từ tính lan tỏa từ màn hình vào điện thoại.
  * **100%:** Điện thoại rung phản hồi haptic, một thẻ voucher Apple Wallet / Google Pay trượt lên trên màn hình điện thoại. Trên màn hình quảng cáo, bộ đếm tương tác tự động nhảy số: `TOTAL INTERACTIONS: 14,892 (+1)`.
* **Nút chuyển hướng:** `Explore Viewixsoft NFC →`

---

### Chương 5: Viewixsoft Tracking — Bằng Chứng Mọi Quảng Cáo Đều Đã Phát
* **Tiêu đề H2:** `How Do Advertisers Verify That Ads Actually Played?`
* **Câu trả lời trực diện:** *"Viewixsoft Tracking generates tamper-evident proof-of-play certificates and real-time screen telemetry, giving network operators and advertisers indisputable broadcast auditing."*
* **Bối cảnh:** Góc máy lùi xa thành bản đồ điều khiển toàn cầu kết hợp khung log terminal trực tiếp.
* **Diễn biến:**
  * **0%:** Máy quay phóng nhanh ra xa khỏi màn hình.
  * **50%:** Toàn bộ các màn hình thu nhỏ thành các điểm sáng nhấp nháy trên bản đồ thế giới (New York, London, Tokyo, Singapore, Sydney...). Mỗi điểm phát ra nhịp đập tín hiệu (heartbeat pulse).
  * **100%:** Khung mã hóa bằng chứng phát sóng (proof-of-play) chạy liên tục bên cạnh:
    ```
    [23:01:42.108] NODE_US_NYC_042  :: FRAME_RENDER_OK  :: SHA256: 7f8a...c9e1
    [23:01:42.194] NODE_UK_LON_119  :: AD_BURST_VERIFIED :: CAMPAIGN_ID: #4092
    [23:01:42.240] NODE_JP_TYO_008  :: PANEL_HEALTH_100% :: TEMP: 41°C
    ```
    Vòng tròn trạng thái hiển thị: `99.98% FLEET HEALTH`.
* **Nút chuyển hướng:** `Explore Viewixsoft Tracking →`

---

### Chương 6: Hồi Kết — Mạng Lưới Của Chính Bạn
* **Tiêu đề H2:** `Ready to Build Your Screen Network?`
* **Câu trả lời trực diện:** *"Deploy Viewixsoft across 10 or 10,000 screens in hours with hardware-agnostic players, unified cloud CMS, and end-to-end telemetry."*
* **Diễn biến:**
  * **0%:** Các điểm sáng trên bản đồ thế giới hội tụ ngược lại theo các đường vector.
  * **50%:** Các đường nối liên kết các sản phẩm lại với nhau dưới dạng các bó giải pháp (Bundles: `CMS + Tracking: Programmatic DOOH Engine`, `POS + NFC: Connected Retail Network`) bằng đường dây nối thay vì các thẻ card đơn điệu.
  * **100%:** Chiếc màn hình gốc ban đầu trở lại vị trí trung tâm với thông điệp: `"Your screen, next."`. Phía dưới là form điền thông tin đăng ký demo nhanh gọn, cùng danh sách phần cứng hỗ trợ (Android, Windows IoT, Linux, LG webOS, Samsung Tizen, BrightSign).

---

## 3. Ba Phương Án Định Hướng Thị Giác (Visual Direction)

Chủ đề xuyên suốt: **"Ánh sáng phát ra từ màn hình trong phòng tối / Phòng điều khiển phát sóng truyền hình (Broadcast Control Room)"**. 
* Không dùng màu slate/cyan, không đổ bóng neon nhòe nhoẹt (glow), không thẻ kính mờ (glassmorphism), không dùng bento grid.
* Nền tối dùng màu mực đen ấm (warm ink); nền sáng dùng giấy ngà ấm (paper off-white). Ánh sáng màu chỉ tỏa ra từ chính màn hình đang phát nội dung.

| Tiêu chí | Phương án A: "Broadcast Master" | Phương án B: "Phosphor Terminal" (Khuyên dùng) | Phương án C: "Master Calibration" |
|---|---|---|---|
| **Cảm hứng** | Phòng điều khiển truyền hình trực tiếp, bàn chuyển sóng switcher. | Màn hình radar, ống phóng tia cathode (CRT), bảng đo telemetry phòng bay. | Bảng vạch màu chuẩn SMPTE, bảng cân chỉnh tín hiệu phát sóng. |
| **Màu tín hiệu chính (Signal)** | **Đỏ-Cam phát sóng (`#ff3b30` / `#ea3829`)** | **Xanh Lục Huỳnh Quang (`#10b981` / `#22c55e`)** | **Vàng Hổ Phách Sodium (`#f59e0b` / `#fbbf24`)** |
| **Độ tương phản WCAG AA** | 5.2:1 (nền tối), 4.8:1 (nền sáng) | **8.4:1 (nền tối)**, 5.6:1 (nền sáng) | **10.2:1 (nền tối)**, 4.9:1 (nền sáng) |
| **Màu nền tối (Dark base)** | Mực đen ấm `#08090b`, Kim loại viền `#1c1e24` | Đen carbon `#070809`, Khung màn hình `#111315` | Đen huyền obsidian `#09090b`, Khung console `#141418` |
| **Màu nền sáng (Light base)**| Giấy ngà `#f7f6f2`, Xám ấm `#eeede8` | Giấy in báo mềm `#f5f4ef`, Xương ấm `#eae8e1` | Alabaster ấm `#f8f7f4`, Be sáng `#edece7` |
| **Cặp Font chữ** | **Syne** (tiêu đề siêu đậm, hiện đại) + **JetBrains Mono** | **Cabinet Grotesk / Clash Display** (kỹ thuật, kiến trúc) + **JetBrains Mono** | **Archivo Black / Bebas Neue** (tiêu đề tràn viền) + **IBM Plex Mono** |
| **Màu ánh sáng màn hình** | CMS: Vàng hổ phách; POS: Vàng quầy thu ngân; NFC: Xanh biển sâu; Tracking: Lục ngọc. | CMS: Xanh băng phát sóng; POS: Hổ phách; NFC: Tím tương tác; Tracking: Lục huỳnh quang. | CMS: Xanh thiên thanh; POS: Vàng kim; NFC: Hồng tín hiệu; Tracking: Lục chanh. |

---

## 4. Giải Pháp Kỹ Thuật & Tối Ưu Hiệu Năng

1. **Thư viện chuyển động (Motion):**
   * Sử dụng thư viện chính thức `motion` (trước đây là Framer Motion, phiên bản React 19).
   * Dung lượng nhẹ: ~28KB gzipped (chỉ nạp `useScroll`, `useTransform`, `motion.*`).
   * Không sử dụng Three.js, GSAP hay Lenis để tránh làm nặng trang web. Các hiệu ứng 3D của màn hình và bản đồ được dựng hoàn toàn bằng SVG và thuộc tính CSS 3D (`transform-style: preserve-3d`).
2. **Kỹ thuật tải lười (Lazy-loading):**
   * Chương 0 (Hero) được render tĩnh trực tiếp bằng SSR HTML để đảm bảo chỉ số **LCP < 2.5s**.
   * Các chương từ 1 đến 6 được chia nhỏ và tải động (`React.lazy`) khi người dùng cuộn đến gần.
3. **Hỗ trợ chế độ giảm chuyển động (`prefers-reduced-motion`):**
   * Nếu người dùng bật chế độ giảm chuyển động trong hệ điều hành: tắt bỏ tính năng cuộn ghim trang (`position: sticky`).
   * Thay vào đó, mỗi chương hiển thị dưới dạng 2 bức ảnh tĩnh so sánh trước/sau đặt cạnh nhau. Toàn bộ nội dung chữ, bảng giá, thông số vẫn đọc được 100%.
4. **Không có JavaScript (SSR / No-JS):**
   * Toàn bộ thẻ tiêu đề H1, H2, đoạn văn trả lời trực diện, thông số kỹ thuật và liên kết đều có sẵn trong mã nguồn HTML được gửi từ server. Các công cụ tìm kiếm và AI bot (ChatGPT, Claude, Perplexity) có thể đọc trọn vẹn mà không cần thực thi JavaScript.
5. **Hiển thị trên điện thoại (Mobile 360px):**
   * Bố cục dọc hoàn toàn, không có thanh cuộn ngang, quãng đường cuộn ngắn hơn (~110vh) để lướt mượt mà trên cảm ứng.

---

## 5. Danh Sách File Dự Kiến Tạo Mới & Sửa Đổi

* **File mới:**
  * `src/components/story/StoryController.tsx` (Bộ điều phối tiến trình cuộn)
  * `src/components/story/ChapterRail.tsx` (Thanh điều hướng chương cố định bên trái)
  * `src/components/story/FixedDemoPill.tsx` (Nút "Book a demo" cố định ở góc)
  * `src/components/story/ChannelSwitcher.tsx` (Nút chuyển kênh các ngành)
  * `src/components/story/primitives/Screen.tsx` (Nhân vật màn hình chính)
  * `src/components/story/primitives/ScreenWall.tsx` (Bức tường 40 màn hình)
  * `src/components/story/primitives/TimelineScrubber.tsx` (Thanh timeline CMS)
  * `src/components/story/primitives/ReceiptToMenu.tsx` (Hóa đơn POS bay lên bảng menu)
  * `src/components/story/primitives/NfcPhoneRipple.tsx` (Điện thoại chạm sóng NFC)
  * `src/components/story/primitives/WorldPulseMap.tsx` (Bản đồ telemetry toàn cầu)
  * `src/components/story/scenes/Scene0Boot.tsx` đến `Scene6Finale.tsx`
* **File cập nhật:**
  * `src/routes/index.tsx`: Chuyển sang bố cục câu chuyện cuộn; giữ nguyên schema SEO và mục FAQ.
  * `src/routes/__root.tsx`: Thêm nút ẩn trợ năng `Skip the story → Products`.
  * `src/styles/tokens.css` & `src/styles/app.css`: Cập nhật bảng màu mới, phông chữ và loại bỏ hoàn toàn các lớp glassmorphism/cyan.
  * `src/routes/design-system.tsx`: Trình diễn các mẫu token và moodboard phòng điều khiển.
  * `package.json`: Thêm gói phụ thuộc `motion`.

---

## 6. Các Bước Triển Khai Tiếp Theo

1. **Phê duyệt:** Bạn xem xét và chọn 1 trong 3 phương án màu sắc/phông chữ (Phương án A, B hoặc C) và xác nhận cài đặt thư viện `motion`.
2. **Thử nghiệm mẫu (Prototype):** Xây dựng trước bản thử nghiệm của **Chương 0 (Bật nguồn)** và **Chương 2 (Đồng bộ CMS)** ngay trên trang chủ để bạn trải nghiệm thực tế cảm giác cuộn trước.
3. **Hoàn thiện:** Sau khi bạn ưng ý, tiếp tục xây dựng các chương còn lại, trang bị chế độ ảnh tĩnh cho `prefers-reduced-motion` và tối ưu điểm số Lighthouse.
