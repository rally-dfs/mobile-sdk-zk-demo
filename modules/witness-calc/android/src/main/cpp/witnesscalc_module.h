#ifndef ANDROID_CMAKE_WITNESSCALC_MODULE_H
#define ANDROID_CMAKE_WITNESSCALC_MODULE_H

#include <jni.h>
#include <sys/mman.h>
#include <android/log.h>
#include "witnesscalc_attestValidMove.h"
#include "witnesscalc_revealMove.h"

extern "C"
{
  JNIEXPORT jint JNICALL Java_com_witnesscalc_WitnessCalcJniBridge_attestValidMove(
      JNIEnv *env, jobject obj,
      jbyteArray circuitBuffer, jlong circuitSize,
      jbyteArray jsonBuffer, jlong jsonSize,
      jbyteArray wtnsBuffer, jlongArray wtnsSize,
      jbyteArray errorMsg, jlong errorMsgMaxSize);


  JNIEXPORT jint JNICALL Java_com_witnesscalc_WitnessCalcJniBridge_revealMove(
      JNIEnv *env, jobject obj,
      jbyteArray circuitBuffer, jlong circuitSize,
      jbyteArray jsonBuffer, jlong jsonSize,
      jbyteArray wtnsBuffer, jlongArray wtnsSize,
      jbyteArray errorMsg, jlong errorMsgMaxSize);
}

#endif // ANDROID_CMAKE_WITNESSCALC_MODULE_H
