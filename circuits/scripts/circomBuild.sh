#!/bin/bash
mkdir build

for circuit in `find src -name "*.circom" -maxdepth 1`; do
  circom $circuit --r1cs --c --sym -o ./build
done