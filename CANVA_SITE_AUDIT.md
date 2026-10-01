# MOKOMOKO Canva Website Audit

## Audit basis

- Primary source: `𝐌𝐎𝐊𝐎𝐌𝐎𝐊𝐎 日系寵物攝影 ⋆⸜ 官方網站 ౨ৎ.pdf` (Canva export, 10 pages, 2026-10-01).
- Public site reference: `https://mkmkpet.my.canva.site/`.
- The PDF is authoritative for visible content and composition. The live Canva page could not be reliably inspected beyond its public title because it is dynamically rendered and the managed browser blocked it, so animation and breakpoint behavior are not directly observable.
- Colors below are sampled from the PDF render and are approximate because export/compression can shift values slightly.

## Visual system

| Element | Observed treatment | HTML baseline decision |
| --- | --- | --- |
| Primary blue | Bright sky blue, approximately `#66B3F8` | `--blue: #66b3f8` |
| Deep blue | Used on pricing cards/ribbons, approximately `#4D83AC` | `--blue-deep: #4d83ac` |
| Secondary blue | Medium blue card tone, approximately `#4FA4E1` | `--blue-mid: #4fa4e1` |
| Warm off-white | Approximately `#F7F7F7` | Main light sections |
| Light gray | Approximately `#E8E8E8` | Package/add-on backgrounds |
| Body text | Warm charcoal, approximately `#473C38` | `--ink: #473c38` |
| Accent yellow | Pale yellow on primary CTA and popular ribbon, approximately `#FFF0B3` / stronger ribbon yellow | CTA and popular badge |
| Accent pink | Soft pink pill on hero | Hero tagline only |
| Large display font | High-contrast serif/mincho; PDF identifies Soukou Mincho in headings | `Noto Serif TC` as a legally web-available substitute |
| Rounded body font | Friendly rounded Chinese type; PDF identifies `cwTeXYen` and GenSenRoundedTW | `Zen Maru Gothic`, then system rounded CJK fallbacks |
| Shadows | Minimal to none | No decorative card shadows |
| Borders | Thin white outlines on blue; gray outlines on light sections | 1–2 px solid borders |
| Corners | Pills are fully rounded; image/card corners approximately 16–22 px | Responsive radii in the same visual range |

### Type hierarchy

- Hero wordmark: dominant, all-caps serif, two stacked `MOKO` lines, approximately 3–4 times body size.
- Section headings: centered mincho/serif, approximately 20–21 pt in the PDF.
- Subsection pills: rounded body font, approximately 16–19 pt.
- Body and list copy: rounded font, approximately 14–17 pt with generous line-height.
- Prices: very large serif numerals with a thin underline.
- Small notes: approximately 12–14 pt, lower contrast on blue pricing cards.

### Spacing and rhythm

- Sections alternate full-bleed blue, off-white, and light gray.
- Content is centered within a wide desktop canvas with large side margins.
- Headings have broad top/bottom breathing room; body copy uses compact but readable 1.7–2.0 line-height.
- Thin vertical dividers separate manifesto/booking blocks.
- Mobile baseline preserves the reading sequence and reduces side padding rather than scaling a fixed desktop canvas.

## Section inventory and exact content

### 1. Hero / cover

- Background: primary sky blue.
- Top-left: Instagram icon and `MKMKPET`.
- Main title: `MOKO` / `MOKO` in oversized white serif lettering.
- Subtitle: `癒し系動物写真`.
- Pink rounded tagline: `生活不只是日復一日，還有毛茸茸的幸福 ♥`.
- Images: large corgi cutout at lower left; orange-and-white cat cutout at lower right; pale-blue organic shape behind the cat; soft white paw-print decorations near corners.
- Bottom edge: white wave transition.

### 2. Navigation / introduction

- Background: primary sky blue with white wave at the bottom.
- Heading: `⋆⸜ MOKOMOKO・日系寵物攝影 ౨ৎ`.
- Supporting line: `女攝影師小魚 ｜ 台北新北 ｜ 全預約制`.
- Four rounded CTA buttons in a 2×2 desktop grid:
  - `品牌理念` → PDF page 3.
  - `攝影方案` → PDF page 4.
  - `常見問題` → PDF page 7.
  - `＼ 點此即刻預約 ／` → PDF page 8; pale-yellow emphasis.

### 3. Brand philosophy

- Background: warm off-white.
- Heading: `⋆⸜ 品牌理念 ౨ৎ`.
- Outlined pill: `モコモコ 形容毛茸茸，像棉花、雲朵的小動物`.
- Copy block:
  - `以獨特柔和的眼光`
  - `捕捉每一幀生活中細微的美好`
  - `注重飼主與毛孩間的真摯情感`
  - `自然而細膩的互動讓畫面更具紀念`
  - `在往後的日子感受到深層次的共鳴`
- Vertical divider.
- Outlined pill: `日系清新色調`.
- Copy block:
  - `毛孩輕輕步入我們的生命裡`
  - `愛與離別正同時進行`
  - `無畏無懼的寶寶／活潑貪玩的朋友`
  - `／沈穩安詳的老伴`
  - `透過我手中的單眼，紀錄每一個階段性的成長`
  - `在片刻的平靜創造出觸動人心的時光`
- Vertical divider.
- Outlined pill: `放慢腳步 細心生活`.

### 4. Photography categories

- Background: light gray.
- Heading: `⋆⸜ 攝影方案 ౨ৎ`.
- Intro:
  - `拍攝價格會隨檔期浮動`
  - `還請把握每一次推出的優惠方案 ♡`
- Outlined pill: `毛孩戶外攝影`.
- Subline: `屬於你們的親子日 .ᐟ.ᐟ`.
- Details:
  - `① 適用對象 狗／貓（已受降敏訓練）`
  - `② 拍攝時長 1–1.5 小時`
- Outlined pill: `特寵棚拍寫真`.
- Subline: `不怕遇雨延期不怕寶貝驚擾 (˶ᐢᗜᐢ˶)`.
- Details:
  - `① 適用對象 貓／天竺鼠／兔／爬蟲／其他`
  - `② 拍攝時長 1 小時，敏感毛孩建議 2 小時`
  - `③ 額外加收租棚費用`

### 5. Pricing plans

- Background: primary sky blue.
- Desktop: three large outlined cards stacked vertically; each card places a landscape image on the left and pricing/details on the right.
- Card 1:
  - Ribbon: `基本方案`
  - Image overlay: `輕鬆體驗`
  - Price: `$4880`
  - `① 精修照 8 張`
- Card 2:
  - Yellow ribbon: `最受歡迎`
  - Image overlay: `CP首選`
  - Price: `$5980`
  - `(原價 $6880)`
  - `① 精修照 10 張`
  - `② 調色毛片 40 張`
  - `＊拍攝時長 1–1.5小時`
  - `＊特寵專屬租棚費折 $200`
- Card 3:
  - Ribbon: `豪華套餐`
  - Image overlay: `一次到位`
  - Price: `$8080`
  - `(原價 $9650)`
  - `① 精修照 15 張`
  - `② 調色毛片 40 張`
  - `贈 寵生四格照 12 條`
  - `贈 30×30cm 無框畫 1 幅`

### 6. Add-ons

- Background: light gray.
- Blue pill: `加購項目`.
- Desktop: two-column dotted-leader price list.
- Items:
  - `【40 張調色毛片】 NT$1000`
  - `【單張精修】 NT$500`
  - `【第 2 隻毛孩】 NT$500`
  - `【租借攝影棚每 1 小時】 NT$1200`
  - `【12 條寵生四格照】 NT$500`
  - `【15×15cm無框畫】 NT$500`
  - `【30×30cm無框畫】 NT$650`
- Images: two rounded landscape product photos side by side—photo-strip samples on the left and two canvas print samples on the right.

### 7. FAQ

- Background: warm off-white.
- Heading: `⋆⸜ 常見問題 ౨ৎ`.
- Intro:
  - `小魚整理了平常收到客人常發問的拍攝相關問題`
  - `如有其他疑惑歡迎至 @mkmkpet 私訊詢問`
- Question: `・我的毛小孩適合拍攝嗎？`
  - `MOKOMOKO 的女攝影師有豐富的拍攝經驗`
  - `無論是敏感／活潑／安靜、寶寶／朋友／老伴`
  - `根據每隻毛孩的個性與年紀的不同`
  - `會有溫柔的專業引導，飼主僅需配合攝影師的指示♡`
  - `什麼樣的毛孩不建議拍攝？`
  - `➤ 具有強烈攻擊性`
  - `➤ 對環境高敏以至於無法外出`
  - `➤ 特殊身體狀況（如高風險生病開刀）`
- Question: `・拍攝地點位於哪裡？`
  - `拍攝地點以雙北公園為主，建議人少乾淨寬敞之空間`
  - `後續細節共同討論，可由攝影師安排常拍攝地點`
  - `外縣市及雙北部分偏遠地區須加收交通費`
  - `（南下交通方式為高鐵與計程車轉乘，當日來回費用）`
- Question: `・狗狗有室內棚拍嗎？`
  - `目前僅接受高敏貓咪與嬌弱特寵（天竺鼠／兔／爬蟲類）`
  - `戶外寫真是我們的日系主推，狗狗能盡情奔放自在`
  - `未來攝影棚擴大時，將開放狗狗體驗室內拍攝`
- Question: `・我所購買的精修可自己挑選嗎？`
  - `攝影師將根據專業角度評估畫面構圖、光線的完美程度`
  - `由於一般人難以僅憑毛片來感受效果，因此無挑片流程`
  - `部分優惠方案已含 40 張調色毛片供收藏`
  - `如有需要還可額外購買精修照片`
- Question: `・精修與調色毛片差在哪裡？`
  - `精修包含明暗對比調整、毛髮瑕疵修正、添加眼神光、`
  - `笑容調整、身形比例調整、畫面雜物去除、`
  - `背景光線修正、獨特色彩風格調整；`
  - `而您所額外加購（或方案內含）的調色毛片`
  - `會經由攝影師進行初步裁切與調色`

### 8. Booking notes

- Background: white.
- Heading: `⋆⸜ 預約須知 ౨ৎ`.
- Intro:
  - `預約流程快速簡單，私訊詢問並預約時段`
  - `也可填寫下方預約單，待攝影師主動與您聯繫`
- Outlined pill: `⁺˖ 女攝影師 小魚 ｜ 療癒系寫真 🫧 ͛.*`.
- Six numbered notes separated by a thin vertical line:
  1. `拍攝地點以雙北地區為主` / `外縣市及雙北部分偏遠地區須加收交通費` / `（南下交通方式為高鐵與計程車轉乘，當日來回費用）`
  2. `假日人潮多，建議挑選平日時段` / `可以盡情在草地上跑跑呦`
  3. `當天陪同人數至多三位` / `以免影響拍攝進度`
  4. `歡迎入鏡合照` / `建議穿著淡色系服裝`
  5. `確認拍攝日期後請於三天內完成匯款` / `逾期不保留檔期`
  6. `MOKOMOKO 有使用肖像之權利` / `可於各平台分享之用途，不方便露臉請事前告知`
- Closing line: `⋆⸜ 若上述內容您皆同意，再請協助填寫毛孩資料：`

### 9. Reservation form area

- PDF contains a full-page screenshot/embed of the original Google Form, headed `MOKOMOKO 寵物攝影預約單`.
- The current migration scope explicitly says not to iframe `mokomoko-booking-form` and not to copy its code.
- Baseline adaptation: replace this embedded form area with a compact external CTA using the existing wording and link to the already-deployed booking page. This preserves the path to booking without integrating the form in this phase.

### 10. Completion / footer-like close

- Background: primary sky blue.
- Heading: `⋆⸜ 填寫完畢請按提交鈕 ౨ৎ`.
- Copy:
  - `感謝您的填寫，待攝影師與您討論`
  - `拍攝之地點與時段`
  - `毛孩本身若有特殊狀況，務必提前告知`
  - `匯款後才正式保留拍攝檔期`
- Centered Instagram icon links to `https://www.instagram.com/mkmkpet/`.
- There is no conventional navigation-heavy footer, copyright line, or secondary legal menu in the PDF.

## Desktop layout baseline

- Full-bleed color bands with a centered content width around 960–1040 px.
- Hero is portrait-oriented and deliberately spacious.
- Navigation uses a centered 2×2 button grid.
- Philosophy, FAQ, and booking copy are centered and vertically sequenced.
- Pricing uses wide horizontal cards; image and pricing columns are approximately 55/45.
- Add-ons use two columns and two landscape images.

## Mobile layout reconstruction

Responsive behavior is not present in the PDF, so it will be reconstructed without changing content:

- Single-column reading order matching the PDF.
- Fluid side padding; no fixed canvas width or `100vw` overflow.
- Hero wordmark scales with `clamp()`; image placeholders stack/overlap only within the hero bounds.
- Navigation remains two columns where it fits and becomes one column at narrow widths.
- Pricing cards stack image over details.
- Add-on list and product images become one column.
- Long FAQ/booking lines wrap naturally and remain center aligned where the PDF is centered.
- All touch targets are at least approximately 44 px high.

## Images and aspect ratios

See `IMAGE_REPLACEMENT.md` for the full handoff list. Observed ratios:

- Hero dog/cat: transparent cutouts, not simple rectangles.
- Pricing photos: landscape, approximately 1.65–1.8:1.
- Add-on product photos: landscape, approximately 1.25–1.4:1.

The PDF contains composed/exported imagery, not confirmed original source files. These exports will not be promoted as final production assets.

## Animation and transitions

- A static PDF cannot preserve Canva animations or section transitions.
- No animation can be verified from the available source.
- The baseline will not invent decorative animations. Only native anchor navigation and a reduced-motion-safe smooth scroll may be used.

## External and internal links

- `https://www.instagram.com/mkmkpet/` — explicitly embedded on PDF page 10.
- Internal navigation targets from PDF page 2: Brand philosophy, photography plans, FAQ, and booking notes.
- Booking baseline target: `https://mokomoko-studio.github.io/mokomoko-booking-form/` (external page, not embedded).

## Known non-1:1 constraints

1. The PDF does not expose responsive breakpoints, hover states, or animation timing.
2. Canva’s Soukou Mincho / cwTeXYen / GenSenRoundedTW files are not provided as licensed webfont assets; legal web-font substitutes are used.
3. Original pet/product photos are not supplied. The baseline uses clearly marked, proportionally correct placeholders instead of low-resolution PDF crops.
4. The PDF’s embedded Google Form area is intentionally replaced by an external booking CTA to follow the phase constraint against embedding or copying booking code.
