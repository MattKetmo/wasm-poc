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
	newFunc, err := instance.Exports.GetFunction("__new")
	if err != nil {
		log.Fatal("Failed to get __new function:", err)
	}

	pinFunc, err := instance.Exports.GetFunction("__pin")
	if err != nil {
		log.Fatal("Failed to get __pin function:", err)
	}

	unpinFunc, err := instance.Exports.GetFunction("__unpin")
	if err != nil {
		log.Fatal("Failed to get __unpin function:", err)
	}

	computeAverage, err := instance.Exports.GetFunction("computePointsAverage")
	if err != nil {
		log.Fatal("Failed to get computePointsAverage function:", err)
	}

	// Get memory
	memory, err := instance.Exports.GetMemory("memory")
	if err != nil {
		log.Fatal("Failed to get memory:", err)
	}

	// Test points as flat array [x1,y1,x2,y2,...]
	points := []float64{
		2.5, 1.0, // point 1 (x,y)
		4.7, 2.5, // point 2 (x,y)
		8.1, 3.7, // point 3 (x,y)
		1.3, 4.2, // point 4 (x,y)
		9.2, 5.8, // point 5 (x,y)
	}

	// Allocate memory for the points array
	arrayPtr, err := newFunc(len(points)*8, 3) // 3 for StaticArray, 8 bytes per f64
	if err != nil {
		log.Fatal("Failed to allocate memory:", err)
	}

	// Pin the memory
	_, err = pinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to pin memory:", err)
	}

	// Copy points to WebAssembly memory
	for i, value := range points {
		offset := int(arrayPtr.(int32)) + (i * 8)
		binary.LittleEndian.PutUint64(memory.Data()[offset:], math.Float64bits(value))
	}

	// Call the WebAssembly function
	resultPtr, err := computeAverage(arrayPtr)
	if err != nil {
		log.Fatal("Failed to compute average:", err)
	}

	// Pin the result
	_, err = pinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to pin result memory:", err)
	}

	// Read results (averageX and averageY)
	averageX := math.Float64frombits(binary.LittleEndian.Uint64(memory.Data()[int(resultPtr.(int32)):]))
	averageY := math.Float64frombits(binary.LittleEndian.Uint64(memory.Data()[int(resultPtr.(int32))+8:]))

	// Unpin memory
	_, err = unpinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to unpin result memory:", err)
	}
	_, err = unpinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to unpin array memory:", err)
	}

	// Print points in a readable format
	fmt.Println("Points:")
	for i := 0; i < len(points); i += 2 {
		fmt.Printf("  (%.1f, %.1f)\n", points[i], points[i+1])
	}
	fmt.Printf("Average X: %.2f\n", averageX)
	fmt.Printf("Average Y: %.2f\n", averageY)
}
