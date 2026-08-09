#pragma once
#include <string>
#include <string_view>

namespace unspool {
std::string inline_script_hash(std::string_view html);
std::string content_security_policy(std::string_view html);
}
