#ifndef ANDROID_CMAKE_RAPIDSNARK_MODULE_H
#define ANDROID_CMAKE_RAPIDSNARK_MODULE_H

#include <jni.h>
#include <sys/mman.h>
#include <android/log.h>
#include "witnesscalc_attestValidMove.h"

extern "C"
{

  JNIEXPORT jint JNICALL Java_com_witnesscalc_WitnessCalcJniBridge_attestValidMove(
      JNIEnv *env, jobject obj,
      jbyteArray circuitBuffer, jlong circuitSize,
      jbyteArray jsonBuffer, jlong jsonSize,
      jbyteArray wtnsBuffer, jlongArray wtnsSize,
      jbyteArray errorMsg, jlong errorMsgMaxSize);

  /*
  groth16_prover(const void *zkey_buffer, unsigned long zkey_size,
                     const void *wtns_buffer, unsigned long wtns_size,
                     char *proof_buffer, unsigned long *proof_size,
                     char *public_buffer, unsigned long *public_size,
                     char *error_msg, unsigned long error_msg_maxsize);

  witnesscalc_attestValidMove(
      const char *circuit_buffer,  unsigned long  circuit_size,
      const char *json_buffer,     unsigned long  json_size,
      char       *wtns_buffer,     unsigned long *wtns_size,
      char       *error_msg,       unsigned long  error_msg_maxsize)
      */
}

#endif // ANDROID_CMAKE_RAPIDSNARK_MODULE_H
