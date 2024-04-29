
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWitnessCalcSpec.h"

@interface WitnessCalc : NSObject <NativeWitnessCalcSpec>
#else
#import <React/RCTBridgeModule.h>

@interface WitnessCalc : NSObject <RCTBridgeModule>
#endif

@end
