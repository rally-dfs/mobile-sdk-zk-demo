#include "NativeSampleModule.h"
#include <iostream>
#include "prover.h"

namespace facebook::react
{

  NativeSampleModule::NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker)
      : NativeSampleModuleCxxSpec(std::move(jsInvoker)) {}

  std::array<std::string, 8> NativeSampleModule::prove(jsi::Runtime &rt, const std::vector<uint8_t> &wtns, const std::vector<uint8_t> &zkey)
  {
    char **s = prove_rs(&wtns[0], wtns.size(), &zkey[0], zkey.size());

    std::array<std::string, 8> proof;
    for (int i = 0; i < 8; i++)
    {
      proof[i] = s[i];
    }

    free_string_array(s, 8);

    return proof;
  }
}
