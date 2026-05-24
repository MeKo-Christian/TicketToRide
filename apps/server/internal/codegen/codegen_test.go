package codegen

import (
	"strings"
	"testing"
)

func TestNewCodeLength(t *testing.T) {
	c := New()
	if len(c) != 6 {
		t.Fatalf("want length 6, got %d (%q)", len(c), c)
	}
}

func TestNewCodeAlphabet(t *testing.T) {
	const forbidden = "01OI"
	for range 200 {
		c := New()
		if len(c) != 6 {
			t.Fatalf("len=%d", len(c))
		}
		if strings.ContainsAny(c, forbidden) {
			t.Fatalf("code %q contains forbidden chars", c)
		}
		for _, r := range c {
			if !strings.ContainsRune(Alphabet, r) {
				t.Fatalf("code %q has rune %q not in alphabet", c, r)
			}
		}
	}
}

func TestNewUniqueWithRetries(t *testing.T) {
	taken := map[string]struct{}{}
	exists := func(s string) bool { _, ok := taken[s]; return ok }
	for range 100 {
		c, err := NewUnique(exists, 8)
		if err != nil {
			t.Fatalf("NewUnique: %v", err)
		}
		if _, dup := taken[c]; dup {
			t.Fatalf("duplicate %q from NewUnique", c)
		}
		taken[c] = struct{}{}
	}
}

func TestNewUniqueExhausts(t *testing.T) {
	_, err := NewUnique(func(string) bool { return true }, 5)
	if err == nil {
		t.Fatal("expected error when all candidates collide")
	}
}
