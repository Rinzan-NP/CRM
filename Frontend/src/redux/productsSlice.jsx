// src/redux/productsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchProducts = createAsyncThunk(
    "products/fetchProducts",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/main/products/");
            console.log(response.data);
            
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createProduct = createAsyncThunk(
    "products/createProduct",
    async (product, { rejectWithValue }) => {
        try {
            const response = await api.post("/main/products/", product);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateProduct = createAsyncThunk(
    "products/updateProduct",
    async (product, { rejectWithValue }) => {
        try {
            const response = await api.put(
                `/main/products/${product.id}/`,
                product
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteProduct = createAsyncThunk(
    "products/deleteProduct",
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/main/products/${id}/`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchVatCategories = createAsyncThunk(
    "products/fetchVatCategories",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/main/vat-settings/");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createVatCategory = createAsyncThunk(
    "products/createVatCategory",
    async (vatCategory, { rejectWithValue }) => {
        try {
            const response = await api.post("/main/vat-settings/", vatCategory);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);
export const updateVatCategory = createAsyncThunk(
    "products/updateVatCategory",
    async ({ id, ...payload }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(
                `/main/vat-settings/${id}/`,
                payload
            );
            return data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const deleteVatCategory = createAsyncThunk(
    "products/deleteVatCategory",
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/main/vat-settings/${id}/`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

const productsSlice = createSlice({
    name: "products",
    initialState: {
        products: [],
        vatCategories: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.products.push(action.payload);
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                const index = state.products.findIndex(
                    (product) => product.id === action.payload.id
                );
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.products = state.products.filter(
                    (product) => product.id !== action.payload
                );
            })
            .addCase(fetchVatCategories.fulfilled, (state, action) => {
                state.vatCategories = action.payload;
            })
            .addCase(createVatCategory.fulfilled, (state, action) => {
                state.vatCategories.push(action.payload);
            })
            .addCase(updateVatCategory.fulfilled, (s, a) => {
                const idx = s.vatCategories.findIndex(
                    (v) => v.id === a.payload.id
                );
                if (idx !== -1) s.vatCategories[idx] = a.payload;
            })
            .addCase(deleteVatCategory.fulfilled, (s, a) => {
                s.vatCategories = s.vatCategories.filter(
                    (v) => v.id !== a.payload
                );
            });
    },
});

export default productsSlice.reducer;
