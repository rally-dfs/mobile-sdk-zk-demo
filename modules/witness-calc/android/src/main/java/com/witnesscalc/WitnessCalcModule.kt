package com.witnesscalc

import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.nio.charset.StandardCharsets

class WitnessCalcModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun calculateAttestValidMoveWitness(datPath: String, jsonStr: String, promise: Promise) {
    val witnessCalcJNI = WitnessCalcJniBridge();

    val circuitByteArray = File(datPath).readBytes()
    val jsonByteArray = jsonStr.toByteArray()

    val wtnsBuffer = ByteArray(8*1024*1024);
    val errorMsg = ByteArray(256);

    val statusCode = witnessCalcJNI.attestValidMove(
      circuitByteArray, circuitByteArray.size.toLong(),
      jsonByteArray, jsonByteArray.size.toLong(),
      wtnsBuffer, longArrayOf(wtnsBuffer.size.toLong()),
      errorMsg, errorMsg.size.toLong())

    if (statusCode != 0) {
      val errorString = String(errorMsg, StandardCharsets.UTF_8)
      promise.reject(java.lang.String.valueOf(statusCode), errorString)
      return
    }

    promise.resolve(Base64.encodeToString(wtnsBuffer, Base64.DEFAULT))
  }
  
  @ReactMethod
  fun calculateRevealMoveWitness(datPath: String, jsonStr: String, promise: Promise) {
    val witnessCalcJNI = WitnessCalcJniBridge();

    val circuitByteArray = File(datPath).readBytes()
    val jsonByteArray = jsonStr.toByteArray()

    val wtnsBuffer = ByteArray(8*1024*1024);
    val errorMsg = ByteArray(256);

    val statusCode = witnessCalcJNI.revealMove(
      circuitByteArray, circuitByteArray.size.toLong(),
      jsonByteArray, jsonByteArray.size.toLong(),
      wtnsBuffer, longArrayOf(wtnsBuffer.size.toLong()),
      errorMsg, errorMsg.size.toLong())

    if (statusCode != 0) {
      val errorString = String(errorMsg, StandardCharsets.UTF_8)
      promise.reject(java.lang.String.valueOf(statusCode), errorString)
      return
    }

    promise.resolve(Base64.encodeToString(wtnsBuffer, Base64.DEFAULT))
  }

  companion object {
    const val NAME = "WitnessCalc"
  }
}

class WitnessCalcJniBridge {

  init {
    System.loadLibrary("witnesscalc_module")
  }

  external fun attestValidMove(
    circuitBuffer: ByteArray, circuitSize: Long,
    jsonBuffer: ByteArray, jsonSize: Long,
    wtnsBuffer: ByteArray, wtnsSize: LongArray,
    errorMsg: ByteArray, errorMsgMaxSize: Long): Int

  external fun revealMove(
    circuitBuffer: ByteArray, circuitSize: Long,
    jsonBuffer: ByteArray, jsonSize: Long,
    wtnsBuffer: ByteArray, wtnsSize: LongArray,
    errorMsg: ByteArray, errorMsgMaxSize: Long): Int
}