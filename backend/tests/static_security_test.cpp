#include "unspool/static_security.hpp"
#include <cassert>
#include <iostream>

int main() {
  const std::string html = "<html><script>console.log('bounded')</script></html>";
  const auto hash = unspool::inline_script_hash(html);
  assert(hash.starts_with("'sha256-")); assert(hash.ends_with("'"));
  const auto policy = unspool::content_security_policy(html);
  assert(policy.find("script-src 'self' 'sha256-") != std::string::npos);
  assert(policy.find("script-src 'self' 'unsafe-inline'") == std::string::npos);
  assert(policy.find("media-src 'self' https://radio.loficafe.net") != std::string::npos);
  bool rejected = false; try { (void)unspool::inline_script_hash("<html></html>"); } catch (const std::invalid_argument&) { rejected = true; }
  assert(rejected); std::cout << "C++23 static security tests passed\n";
}
