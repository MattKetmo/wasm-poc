package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"os"

	"github.com/wasmerio/wasmer-go/wasmer"
)

func main() {
	// Read the WebAssembly file
	wasmBytes, err := os.ReadFile("build/average.wasm")
	if err != nil {
		log.Fatal("Failed to read WASM file:", err)
	}

	// Create an instance of WebAssembly runtime
	engine := wasmer.NewEngine()
	store := wasmer.NewStore(engine)

	// Compile the module
	module, err := wasmer.NewModule(store, wasmBytes)
	if err != nil {
		log.Fatal("Failed to compile module:", err)
	}

	// Create import object with required environment
	importObject := wasmer.NewImportObject()
	importObject.Register("env", map[string]wasmer.IntoExtern{
		"abort": wasmer.NewFunction(
			store,
			wasmer.NewFunctionType(
				[]*wasmer.ValueType{
					wasmer.NewValueType(wasmer.I32),
					wasmer.NewValueType(wasmer.I32),
					wasmer.NewValueType(wasmer.I32),
					wasmer.NewValueType(wasmer.I32),
				},
				[]*wasmer.ValueType{},
			),
			func(args []wasmer.Value) ([]wasmer.Value, error) {
				fmt.Println("Abort called from WASM")
				return []wasmer.Value{}, nil
			},
		),
	})

	// Instantiate the module
	instance, err := wasmer.NewInstance(module, importObject)
	if err != nil {
		log.Fatal("Failed to instantiate module:", err)
	}
	defer instance.Close()

	// Get the required exported functions
	newArray, err := instance.Exports.GetFunction("__new")
	if err != nil {
		log.Fatal("Failed to get __new function:", err)
	}

	computeAverage, err := instance.Exports.GetFunction("computeAverage")
	if err != nil {
		log.Fatal("Failed to get computeAverage function:", err)
	}

	// Get memory
	memory, err := instance.Exports.GetMemory("memory")
	if err != nil {
		log.Fatal("Failed to get memory:", err)
	}

	// Test numbers
	numbers := []float64{2.5, 4.7, 8.1, 1.3, 9.2, 6.4, 3.8, 7.5, 5.9, 2.6}

	// Allocate memory for the array (8 bytes per float64)
	// ID 3 is for StaticArray
	arrayPtr, err := newArray(len(numbers)*8, 3)
	if err != nil {
		log.Fatal("Failed to allocate memory:", err)
	}

	// Copy numbers to WebAssembly memory
	for i, num := range numbers {
		offset := int(arrayPtr.(int32)) + (i * 8)
		binary.LittleEndian.PutUint64(memory.Data()[offset:], math.Float64bits(num))
	}

	// Call the WebAssembly function
	result, err := computeAverage(arrayPtr)
	if err != nil {
		log.Fatal("Failed to compute average:", err)
	}

	fmt.Printf("Numbers: %v\n", numbers)
	fmt.Printf("Average: %.2f\n", result.(float64))
}
