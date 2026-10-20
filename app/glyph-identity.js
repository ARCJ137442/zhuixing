// Audited individual assignments in UCD 17.0; block membership alone is not assignment evidence.
const GlyphIdentity=(()=>{
const known={"你":{"codePoint":"U+4F60","block":"基本区（核心区）"},"𰻝":{"codePoint":"U+30EDD","block":"扩展G区"},"𮘎":{"codePoint":"U+2E60E","block":"扩展F区"},"𲈤":{"codePoint":"U+32224","block":"扩展H区"},"仁":{"codePoint":"U+4EC1","block":"基本区（核心区）"},"明":{"codePoint":"U+660E","block":"基本区（核心区）"},"休":{"codePoint":"U+4F11","block":"基本区（核心区）"},"好":{"codePoint":"U+597D","block":"基本区（核心区）"},"男":{"codePoint":"U+7537","block":"基本区（核心区）"}};
function describe(character){const row=known[character];return row?"Unicode 已收录 · "+row.block+" · "+row.codePoint:"字符身份未核对";}
return {describe};
})();
