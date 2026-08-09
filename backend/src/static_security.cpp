#include "unspool/static_security.hpp"
#include <stdexcept>
#include <openssl/evp.h>
#include <openssl/sha.h>

namespace unspool {
std::string inline_script_hash(std::string_view html) {
  const auto opening = html.find("<script>");
  if (opening == std::string_view::npos) throw std::invalid_argument("Static index has no bootstrap script");
  const auto start = opening + std::string_view("<script>").size(); const auto end = html.find("</script>", start);
  if (end == std::string_view::npos) throw std::invalid_argument("Static index has an unterminated bootstrap script");
  const auto script = html.substr(start, end - start); unsigned char digest[SHA256_DIGEST_LENGTH];
  SHA256(reinterpret_cast<const unsigned char*>(script.data()), script.size(), digest);
  std::string encoded(4 * ((SHA256_DIGEST_LENGTH + 2) / 3), '\0');
  encoded.resize(static_cast<std::size_t>(EVP_EncodeBlock(reinterpret_cast<unsigned char*>(encoded.data()), digest, SHA256_DIGEST_LENGTH)));
  return "'sha256-" + encoded + "'";
}

std::string content_security_policy(std::string_view html) {
  return "default-src 'self'; script-src 'self' " + inline_script_hash(html)
    + "; img-src 'self' data:; media-src 'self' https://radio.loficafe.net; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
}
}
