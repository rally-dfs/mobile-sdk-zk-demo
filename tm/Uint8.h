#pragma once

#include <react/bridging/Bridging.h>

namespace facebook::react
{
  template <>
  struct Bridging<uint8_t>
  {
    static uint32_t fromJs(jsi::Runtime &, const jsi::Value &value)
    {
      return (uint8_t)value.asNumber();
    }

    static jsi::Value toJs(jsi::Runtime &, uint8_t value)
    {
      return (double)value;
    }
  };

} // namespace facebook::react