const bcrypt = require("bcrypt");

const password = "admin123";
const hash = "$2b$10$atPCcmsG5.OqNRjMKNHiN.DMplwDSDLZchjQM7K0m5/wWebGKrjLS";

bcrypt.compare(password, hash).then(res => {
    console.log("¿Coincide?:", res);
});
