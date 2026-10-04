const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.log("\n❌ Pakai: node generate-hash.js <password>\n");
  console.log("Contoh: node generate-hash.js 123456\n");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("\n============================================");
  console.log("✅ HASH BERHASIL DIBUAT");
  console.log("============================================");
  console.log("Password : " + password);
  console.log("Hash     : " + hash);
  console.log("============================================");
  console.log("\n📋 Copy hash di atas ke file developer-accounts.js\n");
  process.exit(0);
});
