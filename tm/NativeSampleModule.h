#pragma once

#if __has_include(<React-Codegen/AppSpecsJSI.h>) // CocoaPod headers on Apple
#include <React-Codegen/AppSpecsJSI.h>
#elif __has_include("AppSpecsJSI.h") // CMake headers on Android
#include "AppSpecsJSI.h"
#endif
#include <memory>
#include <string>
#include "Uint8.h"

namespace facebook::react
{
  class NativeSampleModule : public NativeSampleModuleCxxSpec<NativeSampleModule>
  {
  public:
    NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker);
    std::array<std::string, 8> prove(jsi::Runtime &rt, const std::vector<uint8_t> &wtns, const std::vector<uint8_t> &zkey);
  };

} // namespace facebook::react
