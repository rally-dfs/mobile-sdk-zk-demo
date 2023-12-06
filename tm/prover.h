#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

extern "C" char **prove_rs(const uint8_t *w, size_t w_len, const uint8_t *z, size_t z_len);
extern "C" void free_string_array(char **ptr, int len);