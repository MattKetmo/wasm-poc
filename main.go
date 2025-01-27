package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/wasmerio/wasmer-go/wasmer"
)

type Kline struct {
	Timestamp int64   // 8 bytes
	Open      float64 // 8 bytes
	Close     float64 // 8 bytes
	Low       float64 // 8 bytes
	High      float64 // 8 bytes
	Volume    float64 // 8 bytes
}

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

	setKline, err := instance.Exports.GetFunction("setKline")
	if err != nil {
		log.Fatal("Failed to get setKline function:", err)
	}

	findBullishKlines, err := instance.Exports.GetFunction("findBullishKlines")
	if err != nil {
		log.Fatal("Failed to get findBullishKlines function:", err)
	}

	memory, err := instance.Exports.GetMemory("memory")
	if err != nil {
		log.Fatal("Failed to get memory:", err)
	}

	// Test klines
	klines := []Kline{
		{Timestamp: 1706371200000, Open: 42000.50, Close: 42150.75, Low: 41950.25, High: 42200.00, Volume: 100.5}, // Bullish
		{Timestamp: 1706371500000, Open: 42150.75, Close: 42100.25, Low: 42080.00, High: 42180.50, Volume: 85.3},  // Bearish
		{Timestamp: 1706371800000, Open: 42100.25, Close: 42250.50, Low: 42090.75, High: 42300.00, Volume: 120.7}, // Bullish
		{Timestamp: 1706372100000, Open: 42250.50, Close: 42200.25, Low: 42150.00, High: 42280.25, Volume: 95.2},  // Bearish
		{Timestamp: 1706372400000, Open: 42200.25, Close: 42350.75, Low: 42180.50, High: 42400.00, Volume: 110.4}, // Bullish
		{Timestamp: 1706372700000, Open: 42350.75, Close: 42320.25, Low: 42300.00, High: 42380.50, Volume: 88.6},  // Bearish
		{Timestamp: 1706373000000, Open: 42320.25, Close: 42450.50, Low: 42310.75, High: 42500.00, Volume: 130.2}, // Bullish
		{Timestamp: 1706373300000, Open: 42450.50, Close: 42400.25, Low: 42380.00, High: 42480.25, Volume: 92.8},  // Bearish
		{Timestamp: 1706373600000, Open: 42400.25, Close: 42550.75, Low: 42390.50, High: 42600.00, Volume: 115.9}, // Bullish
		{Timestamp: 1706373900000, Open: 42550.75, Close: 42650.25, Low: 42530.00, High: 42680.50, Volume: 105.1}, // Bullish
	}

	// Allocate memory for klines array (48 bytes per Kline)
	arrayPtr, err := newFunc(len(klines)*48, 3) // 3 for StaticArray
	if err != nil {
		log.Fatal("Failed to allocate memory:", err)
	}

	// Pin the memory
	_, err = pinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to pin memory:", err)
	}

	// Set klines using the helper function
	for i, k := range klines {
		_, err = setKline(arrayPtr, i, k.Timestamp, k.Open, k.Close, k.Low, k.High, k.Volume)
		if err != nil {
			log.Fatal("Failed to set kline:", err)
		}
	}

	// Find bullish klines
	resultPtr, err := findBullishKlines(arrayPtr, len(klines))
	if err != nil {
		log.Fatal("Failed to find bullish klines:", err)
	}

	// Pin the result
	_, err = pinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to pin result memory:", err)
	}

	// Count bullish klines for array size
	bullishCount := 0
	for _, k := range klines {
		if k.Close > k.Open {
			bullishCount++
		}
	}

	// Read timestamps of bullish klines
	bullishTimestamps := make([]int64, bullishCount)
	for i := 0; i < bullishCount; i++ {
		timestamp := int64(binary.LittleEndian.Uint64(memory.Data()[resultPtr.(int32)+int32(i*8):]))
		bullishTimestamps[i] = timestamp
	}

	// Clean up
	_, err = unpinFunc(resultPtr)
	if err != nil {
		log.Fatal("Failed to unpin result memory:", err)
	}
	_, err = unpinFunc(arrayPtr)
	if err != nil {
		log.Fatal("Failed to unpin array memory:", err)
	}

	// Print results
	fmt.Println("Analyzed Klines:")
	for _, k := range klines {
		trend := "BEARISH"
		if k.Close > k.Open {
			trend = "BULLISH"
		}
		fmt.Printf("Timestamp: %v\n", time.UnixMilli(k.Timestamp).UTC().Format(time.RFC3339))
		fmt.Printf("  Open: %.2f\n", k.Open)
		fmt.Printf("  Close: %.2f\n", k.Close)
		fmt.Printf("  Trend: %s\n", trend)
		fmt.Println("---")
	}

	fmt.Println("\nBullish Kline Timestamps:")
	for _, timestamp := range bullishTimestamps {
		fmt.Println(time.UnixMilli(timestamp).UTC().Format(time.RFC3339))
	}
	fmt.Printf("\nTotal Bullish Klines: %d\n", len(bullishTimestamps))
}
