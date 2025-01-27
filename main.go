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
	Z    int32
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
		{X: 2.5, Y: 1.0, Z: 10},
		{X: 4.7, Y: 2.5, Z: 20},
		{X: 8.1, Y: 3.7, Z: 15},
		{X: 1.3, Y: 4.2, Z: 30},
		{X: 9.2, Y: 5.8, Z: 25},
	}

	// Allocate memory for points array (20 bytes per Point)
	arrayPtr, err := newFunc(len(points)*20, 3)
	if err != nil {
		log.Fatal("Failed to allocate memory:", err)
	}

	_, err = pinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to pin memory:", err)
	}

	// Set points using the helper function
	for i, p := range points {
		_, err = setPoint(arrayPtr, i, p.X, p.Y, int32(p.Z))
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
	averageZ := math.Float64frombits(binary.LittleEndian.Uint64(memory.Data()[int(resultPtr.(int32))+16:]))

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
		fmt.Printf("  (%.1f, %.1f, %d)\n", p.X, p.Y, p.Z)
	}
	fmt.Printf("Average X: %.2f\n", averageX)
	fmt.Printf("Average Y: %.2f\n", averageY)
	fmt.Printf("Average Z: %.2f\n", averageZ)
}
