#include "unspool/static_security.hpp"
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <httplib.h>

namespace fs = std::filesystem;
namespace {
std::string env(std::string_view key, std::string fallback = {}) { if (const auto* value = std::getenv(std::string(key).c_str())) return value; return fallback; }
std::string read_file(const fs::path& path) { std::ifstream input(path, std::ios::binary); std::ostringstream output; output << input.rdbuf(); return output.str(); }
}
int main(int argc, char** argv) {
  int port = std::stoi(env("PORT", "4173")); fs::path static_root = env("UNSPOOL_STATIC_ROOT", "build");
  for (int index = 1; index + 1 < argc; ++index) { const std::string flag = argv[index]; if (flag == "--port") port = std::stoi(argv[++index]); else if (flag == "--static-root") static_root = argv[++index]; }
  httplib::Server server;
  server.Get("/healthz", [](const httplib::Request&, httplib::Response& response) { response.set_content(R"({"status":"ok","runtime":"c++23","privacyMode":"local-first","networkAudit":"none"})", "application/json; charset=utf-8"); response.set_header("Cache-Control", "no-store"); });
  if (!fs::exists(static_root / "index.html")) { std::cerr << "Static root does not contain index.html: " << fs::absolute(static_root) << '\n'; return 2; }
  const auto csp = unspool::content_security_policy(read_file(static_root / "index.html"));
  server.set_mount_point("/", static_root.string());
  server.set_error_handler([static_root](const httplib::Request& request, httplib::Response& response) { if (response.status == 404 && request.method == "GET" && !request.path.starts_with("/api/")) { response.status = 200; response.set_content(read_file(static_root / "index.html"), "text/html; charset=utf-8"); } });
  server.set_post_routing_handler([csp](const httplib::Request& request, httplib::Response& response) { response.set_header("Content-Security-Policy", csp); response.set_header("X-Content-Type-Options", "nosniff"); response.set_header("X-Frame-Options", "DENY"); response.set_header("Referrer-Policy", "no-referrer"); response.set_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()"); if (request.path != "/healthz") { if (request.path == "/" || request.path.ends_with("index.html") || request.path.ends_with("service-worker.js") || request.path.ends_with(".webmanifest")) response.set_header("Cache-Control", "no-cache"); else response.set_header("Cache-Control", "public, max-age=31536000, immutable"); } });
  std::cout << "Unspool C++23 listening on " << port << " with static root " << fs::absolute(static_root) << '\n'; if (!server.listen("0.0.0.0", port)) { std::cerr << "Failed to bind port " << port << '\n'; return 1; }
}
