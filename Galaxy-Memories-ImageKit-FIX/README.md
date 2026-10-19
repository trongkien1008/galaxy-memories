# Galaxy Memories — ImageKit Edition

Project thiên hà kỷ niệm dùng ImageKit làm nguồn media.

- Endpoint: `https://ik.imagekit.io/akf`
- Root: `/YTC_Memories`
- Groups: `1` → `8`
- Không cần đổi tên file.
- `update-images.mjs` dùng ImageKit List Assets API ở máy local để tạo `images.js` và `images.json`.
- Private key **không nằm trong HTML** và không được upload lên host.

## Cập nhật ảnh

1. Chạy `SETUP-IMAGEKIT.bat` một lần và điền Private Key.
2. Chạy `UPDATE-IMAGES.bat` sau mỗi lần thay đổi ảnh.
3. Mở `index.html` để test.

Nên dùng Restricted API Key với quyền Media management = Read only.
