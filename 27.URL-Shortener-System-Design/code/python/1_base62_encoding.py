"""Base62 encoding/decoding for URL shortener IDs"""

BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = 62


def encode(num: int) -> str:
    """
    Convert a decimal number to base62 string.
    
    Example:
        encode(123456789) -> "8m0kx"
        encode(0) -> "0"
        encode(62) -> "10"
    """
    if num == 0:
        return "0"
    
    digits = []
    while num > 0:
        digits.append(BASE62_CHARS[num % BASE])
        num //= BASE
    
    # Reverse to get most significant digit first
    return "".join(reversed(digits))


def decode(code: str) -> int:
    """
    Convert a base62 string back to decimal number.
    
    Example:
        decode("8m0kx") -> 123456789
        decode("0") -> 0
        decode("10") -> 62
    """
    result = 0
    for char in code:
        try:
            idx = BASE62_CHARS.index(char)
        except ValueError:
            return 0  # Invalid character
        
        result = result * BASE + idx
    
    return result


def codepoints(length: int) -> int:
    """
    Calculate how many unique codes can be generated with N characters.
    
    Example:
        codepoints(6) -> 56,800,235,584 (62^6)
        codepoints(7) -> 3,521,614,606,208 (62^7)
    """
    return BASE ** length


if __name__ == "__main__":
    # Test cases
    test_cases = [0, 1, 61, 62, 123456789, 999999999]
    
    print("Base62 Encoding/Decoding Tests:")
    print("-" * 50)
    
    for num in test_cases:
        encoded = encode(num)
        decoded = decode(encoded)
        match = "✓" if num == decoded else "✗"
        print(f"{match} ID: {num:>10} -> Code: {encoded:>8} -> ID: {decoded:>10}")
    
    print("\nCodepoint Calculations:")
    print("-" * 50)
    
    for length in range(1, 8):
        points = codepoints(length)
        print(f"Length {length}: {points:>15,} unique codes")
