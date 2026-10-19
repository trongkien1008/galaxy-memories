# Galaxy Memories - ImageKit Edition (Windows fix)

Project thien ha ky niem dung ImageKit lam nguon media.

- Endpoint: `https://ik.imagekit.io/akf`
- Root: `/YTC_Memories`
- Groups: `1` den `8`
- Khong can doi ten file.
- `UPDATE-IMAGES.bat` da duoc sua thanh ASCII + Windows CRLF de tranh loi CMD.
- `update-images.mjs` tu lay ten file tren ImageKit va tao lai `images.js` + `images.json`.
- Private key KHONG nam trong HTML va khong duoc upload len host.

## Cach cap nhat anh tren Windows

1. Chay `SETUP-IMAGEKIT.bat` mot lan.
2. Dan ImageKit Private Key vao `imagekit.private.json`, Save.
3. Chay `UPDATE-IMAGES.bat`.
4. Khi thay `DONE`, mo `index.html` de test.

Neu bao `Node.js was not found`, cai Node.js 18+ tu https://nodejs.org/ roi chay lai.

Nen dung Restricted API Key voi quyen Media management = Read only neu tai khoan ImageKit ho tro.
