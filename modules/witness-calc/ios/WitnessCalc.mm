#import "WitnessCalc.h"
#import "witnesscalc_attestValidMove.h"
#import "witnesscalc_revealMove.h"

@implementation WitnessCalc
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(calculateAttestValidMoveWitness:(NSString *)datPath
                  jsonString:(NSString *)jsonString
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSError *datLoadError = nil;
    NSData *fileData = [NSData dataWithContentsOfFile:datPath options:0 error:&datLoadError];

    if (datLoadError) {
        NSLog(@"Error reading file: %@", datLoadError.localizedDescription);
    } 
    
    const char *datBytes = (char *)[fileData bytes];
    NSUInteger datLength = [fileData length];
    
    const char *jsonBytes = [jsonString UTF8String];
    size_t jsonLength = strlen(jsonBytes);

    size_t witnessBufferSize = 8*1024*1024;
    char witnessBuffer[witnessBufferSize];

    size_t witnessSize = sizeof(witnessBuffer);

    char   errorMessage[256];

    int error = witnesscalc_attestValidMove(
                        datBytes, (unsigned long)datLength,
                        jsonBytes, jsonLength,
                        witnessBuffer, &witnessSize,
                        errorMessage, sizeof(errorMessage));

    if (error == 0) {
        NSData *witness = [[NSData alloc] initWithBytes:witnessBuffer length:witnessSize];
        NSString *base64Encoded = [witness base64EncodedStringWithOptions:0];
        resolve(base64Encoded);
    } else {
        NSString *errorString = [NSString stringWithCString:errorMessage encoding:NSUTF8StringEncoding];
        reject(@"error", errorString, nil);
    }
}

RCT_EXPORT_METHOD(calculateRevealMoveWitness:(NSString *)datPath
                  jsonString:(NSString *)jsonString
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSError *datLoadError = nil;
    NSData *fileData = [NSData dataWithContentsOfFile:datPath options:0 error:&datLoadError];

    if (datLoadError) {
        NSLog(@"Error reading file: %@", datLoadError.localizedDescription);
    } 
    
    const char *datBytes = (char *)[fileData bytes];
    NSUInteger datLength = [fileData length];
    
    const char *jsonBytes = [jsonString UTF8String];
    size_t jsonLength = strlen(jsonBytes);

    size_t witnessBufferSize = 8*1024*1024;
    char witnessBuffer[witnessBufferSize];

    size_t witnessSize = sizeof(witnessBuffer);

    char   errorMessage[256];

    int error = witnesscalc_revealMove(
                        datBytes, (unsigned long)datLength,
                        jsonBytes, jsonLength,
                        witnessBuffer, &witnessSize,
                        errorMessage, sizeof(errorMessage));

    if (error == 0) {
        NSData *witness = [[NSData alloc] initWithBytes:witnessBuffer length:witnessSize];
        NSString *base64Encoded = [witness base64EncodedStringWithOptions:0];
        resolve(base64Encoded);
    } else {
        NSString *errorString = [NSString stringWithCString:errorMessage encoding:NSUTF8StringEncoding];
        reject(@"error", errorString, nil);
    }
}

@end
