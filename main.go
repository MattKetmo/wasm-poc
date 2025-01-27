package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"os"

	"github.com/wasmerio/wasmer-go/wasmer"
)

type Point struct {
	X, Y float64
}

func main() {
	wasmBytes, err := os.ReadFile("build/average.wasm")
	if err != nil {
		log.Fatal("Failed to read WASM file:", err)
	}

	engine := wasmer.NewEngine()
	store := wasmer.NewStore(engine)

	module, err := wasmer.NewModule(store, wasmBytes)
	if err != nil {
		log.Fatal("Failed to compile module:", err)
	}

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

	instance, err := wasmer.NewInstance(module, importObject)
	if err != nil {
		log.Fatal("Failed to instantiate module:", err)
	}
	defer instance.Close()

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

	setPoint, err := instance.Exports.GetFunction("setPoint")
	if err != nil {
		log.Fatal("Failed to get setPoint function:", err)
	}

	computeAverage, err := instance.Exports.GetFunction("computePointsAverage")
	if err != nil {
		log.Fatal("Failed to get computePointsAverage function:", err)
	}

	memory, err := instance.Exports.GetMemory("memory")
	if err != nil {
		log.Fatal("Failed to get memory:", err)
	}

	// Test points
	points := []Point{
		{X: 2.5, Y: 1.0},
		{X: 4.7, Y: 2.5},
		{X: 8.1, Y: 3.7},
		{X: 1.3, Y: 4.2},
		{X: 9.2, Y: 5.8},
	}

	// Allocate memory for points array
	arrayPtr, err := newFunc(len(points)*16, 3) // 16 bytes per Point
	if err != nil {
		log.Fatal("Failed to allocate memory:", err)
	}

	_, err = pinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to pin memory:", err)
	}

	// Set points using the helper function
	for i, p := range points {
		_, err = setPoint(arrayPtr, i, p.X, p.Y)
		if err != nil {
			log.Fatal("Failed to set point:", err)
		}
	}

	// Compute averages
	resultPtr, err := computeAverage(arrayPtr, len(points))
	if err != nil {
		log.Fatal("Failed to compute average:", err)
	}

	_, err = pinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to pin result memory:", err)
	}

	// Read results
	averageX := math.Float64frombits(binary.LittleEndian.Uint64(memory.Data()[int(resultPtr.(int32)):]))
	averageY := math.Float64frombits(binary.LittleEndian.Uint64(memory.Data()[int(resultPtr.(int32))+8:]))

	_, err = unpinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to unpin result memory:", err)
	}
	_, err = unpinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to unpin array memory:", err)
	}

	fmt.Println("Points:")
	for _, p := range points {
		fmt.Printf("  (%.1f, %.1f)\n", p.X, p.Y)
	}
	fmt.Printf("Average X: %.2f\n", averageX)
	fmt.Printf("Average Y: %.2f\n", averageY)
}
