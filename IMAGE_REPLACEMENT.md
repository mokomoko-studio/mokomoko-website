# MOKOMOKO image replacement list

The Canva PDF contains composed/exported imagery, not confirmed original source files. The HTML baseline therefore uses labeled placeholders at the correct locations and proportions. Do not replace these with PDF screenshots; use the original edited photographs or high-resolution exports.

| Section | Canva reference | Suggested ratio | Suggested minimum size | Suggested filename | Notes |
| --- | --- | --- | --- | --- | --- |
| Hero | Corgi cutout at lower left on PDF page 1 | Transparent cutout, roughly 4:5 | 1600×2000 px PNG/WebP with alpha | `hero-corgi.webp` | Keep the complete ears/body edge and transparent background. |
| Hero | Orange-and-white cat cutout at lower right on PDF page 1 | Transparent cutout, roughly 4:5 | 1600×2000 px PNG/WebP with alpha | `hero-cat.webp` | Keep the complete head/body edge; pale-blue organic backdrop can remain CSS. |
| Basic plan | Orange cat outdoors, PDF page 5 card 1 | 16:9 landscape | 1600×900 px | `plan-basic-cat.webp` | Leave safe space for `基本方案` ribbon and `輕鬆體驗` overlay. |
| Popular plan | Happy dog outdoors, PDF page 5 card 2 | 16:9 landscape | 1600×900 px | `plan-popular-dog.webp` | Leave safe space for yellow `最受歡迎` ribbon and `CP首選`. |
| Luxury plan | Guinea pigs posed with books, PDF page 5 card 3 | 16:9 landscape | 1600×900 px | `plan-luxury-small-pets.webp` | Leave safe space for `豪華套餐` ribbon and `一次到位`. |
| Add-ons | Photo-strip product display/easel, PDF page 6 lower left | About 4:3 landscape | 1400×1050 px | `addon-photo-strips.webp` | Product should remain readable after mobile crop. |
| Add-ons | Two canvas print products, PDF page 6 lower right | About 4:3 landscape | 1400×1050 px | `addon-canvas-prints.webp` | Preserve both print sizes and neutral studio background. |

## Replacement handling

1. Place optimized files in `assets/images/`.
2. Prefer WebP at approximately 75–85 quality; keep alpha for the hero cutouts.
3. Add width/height attributes and descriptive Traditional Chinese alt text when converting placeholders to `<img>` elements.
4. Keep each file below roughly 400 KB where practical, while checking fur detail at 2× mobile density.
