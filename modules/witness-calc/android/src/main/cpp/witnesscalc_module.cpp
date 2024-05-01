#include "witnesscalc_module.h"

#define TAG "WitnessCalcNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

#ifdef __cplusplus
extern "C"
{
#endif

  JNIEXPORT jint JNICALL Java_com_witnesscalc_WitnessCalcJniBridge_attestValidMove(
      JNIEnv *env, jobject obj,
      jbyteArray circuitBuffer, jlong circuitSize,
      jbyteArray jsonBuffer, jlong jsonSize,
      jbyteArray wtnsBuffer, jlongArray wtnsSize,
      jbyteArray errorMsg, jlong errorMsgMaxSize)
  {
    LOGI("attestValidMove native called");

    // Convert jbyteArray to native types
    const char *nativeCircuitBuffer = (char *)env->GetByteArrayElements(circuitBuffer, nullptr);
    const char *nativeJsonBuffer = (char *)env->GetByteArrayElements(jsonBuffer, nullptr);

    char *nativeWtnsBuffer = (char *)env->GetByteArrayElements(wtnsBuffer, nullptr);
    char *nativeErrorMsg = (char *)env->GetByteArrayElements(errorMsg, nullptr);

    jlong *nativeWtnsSizeArr = env->GetLongArrayElements(wtnsSize, 0);

    unsigned long nativeWtnsSize = nativeWtnsSizeArr[0];

    // Call the witness calculation function
    int result = witnesscalc_attestValidMove(
        nativeCircuitBuffer, circuitSize,
        nativeJsonBuffer, jsonSize,
        nativeWtnsBuffer, &nativeWtnsSize,
        nativeErrorMsg, errorMsgMaxSize);

    // Convert the results back to JNI types
    nativeWtnsSizeArr[0] = nativeWtnsSize;

    env->SetLongArrayRegion(wtnsSize, 0, 1, (jlong *)nativeWtnsSizeArr);

    // Release the native buffers
    env->ReleaseByteArrayElements(circuitBuffer, (jbyte *)nativeCircuitBuffer, 0);
    env->ReleaseByteArrayElements(jsonBuffer, (jbyte *)nativeJsonBuffer, 0);
    env->ReleaseByteArrayElements(wtnsBuffer, (jbyte *)nativeWtnsBuffer, 0);
    env->ReleaseByteArrayElements(errorMsg, (jbyte *)nativeErrorMsg, 0);

    env->ReleaseLongArrayElements(wtnsSize, (jlong *)nativeWtnsSizeArr, 0);

    return result;
  }

#ifdef __cplusplus
}
#endif