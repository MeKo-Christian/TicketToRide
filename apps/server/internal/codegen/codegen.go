// Package codegen produces short, human-friendly join codes.
package codegen

import (
	"crypto/rand"
	"errors"
)

// Alphabet excludes 0/O/1/I to avoid ambiguity when read aloud or typed.
const Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const Length = 6

// New returns a fresh random 6-char code.
func New() string {
	b := make([]byte, Length)
	if _, err := rand.Read(b); err != nil {
		panic("codegen: rand.Read failed: " + err.Error())
	}
	out := make([]byte, Length)
	for i := range b {
		out[i] = Alphabet[int(b[i])%len(Alphabet)]
	}
	return string(out)
}

// NewUnique generates codes until exists(code) returns false or maxAttempts
// is exceeded.
func NewUnique(exists func(string) bool, maxAttempts int) (string, error) {
	for range maxAttempts {
		c := New()
		if !exists(c) {
			return c, nil
		}
	}
	return "", errors.New("codegen: failed to generate unique code")
}
