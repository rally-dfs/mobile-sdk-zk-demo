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
    unsigned long datLength = [fileData length];
    
    const char *jsonBytes = [jsonString UTF8String];
    unsigned long jsonLength = strlen(jsonBytes);

    unsigned long witnessBufferSize = 8*1024*1024;
    char *witnessBuffer = (char *)malloc(witnessBufferSize);

    unsigned long errorMessageMaxSize = 256;
    char   errorMessage[errorMessageMaxSize];

    int error = witnesscalc_attestValidMove(
                        datBytes, datLength,
                        jsonBytes, jsonLength,
                        witnessBuffer, &witnessBufferSize,
                        errorMessage, errorMessageMaxSize);

    if (error == 0) {
        NSData *witness = [[NSData alloc] initWithBytes:witnessBuffer length:witnessBufferSize];
        NSString *base64Encoded = [witness base64EncodedStringWithOptions:0];
        resolve(base64Encoded);
    } else {
        NSString *errorString = [NSString stringWithCString:errorMessage encoding:NSUTF8StringEncoding];
        reject(@"error", errorString, nil);
    }
    free(witnessBuffer);
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
    unsigned long datLength = [fileData length];
    
    const char *jsonBytes = [jsonString UTF8String];
    unsigned long jsonLength = strlen(jsonBytes);

    unsigned long witnessBufferSize = 8*1024*1024;
    char *witnessBuffer = (char *)malloc(witnessBufferSize);

    unsigned long errorMessageMaxSize = 256;
    char   errorMessage[errorMessageMaxSize];

    int error = witnesscalc_revealMove(
                        datBytes, datLength,
                        jsonBytes, jsonLength,
                        witnessBuffer, &witnessBufferSize,
                        errorMessage, errorMessageMaxSize);

    if (error == 0) {
        NSData *witness = [[NSData alloc] initWithBytes:witnessBuffer length:witnessBufferSize];
        NSString *base64Encoded = [witness base64EncodedStringWithOptions:0];
        resolve(base64Encoded);
    } else {
        NSString *errorString = [NSString stringWithCString:errorMessage encoding:NSUTF8StringEncoding];
        reject(@"error", errorString, nil);
    }
    free(witnessBuffer);
}

@end
