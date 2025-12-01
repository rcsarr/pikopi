import { createClient } from '@supabase/supabase-js';

// ✅ Gunakan import.meta.env untuk Vite (atau process.env untuk Create React App)
const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    'https://ykmugmhlanvjxazjwsdi.supabase.co';

const SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    'sb_publishable_wXeh5bK7AkYup8-RiwdWsA_qDVuZpf9';

// ✅ Validasi environment variables
if (!SUPABASE_URL || SUPABASE_URL === 'https://ykmugmhlanvjxazjwsdi.supabase.co') {
    console.warn('⚠️ SUPABASE_URL menggunakan default value');
    console.warn('Untuk production, set VITE_SUPABASE_URL atau REACT_APP_SUPABASE_URL di .env.local');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'sb_publishable_wXeh5bK7AkYup8-RiwdWsA_qDVuZpf9') {
    console.warn('⚠️ SUPABASE_ANON_KEY menggunakan default value');
    console.warn('Untuk production, set VITE_SUPABASE_ANON_KEY atau REACT_APP_SUPABASE_ANON_KEY di .env.local');
}

// ✅ Log initialization (masked untuk security)
console.log('✅ Supabase Client Initialized:', {
    url: SUPABASE_URL.substring(0, 30) + '...',
    key: SUPABASE_ANON_KEY.substring(0, 20) + '...',
    environment: import.meta.env.MODE || 'development'
});

// ✅ Create Supabase client
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ✅ Optional: Helper functions untuk common operations
export const uploadPaymentProof = async (
    file: File,
    orderId: string
): Promise<string | null> => {
    try {
        // Generate unique filename
        const timestamp = new Date().getTime();
        const ext = file.name.split('.').pop();
        const filename = `${orderId}_${timestamp}.${ext}`;

        console.log('📤 Uploading to Supabase Storage:', filename);

        // Upload ke Supabase Storage - payments bucket
        const { data, error } = await supabase
            .storage
            .from('payments')
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('❌ Upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase
            .storage
            .from('payments')
            .getPublicUrl(filename);

        console.log('✅ Upload successful:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (err: any) {
        console.error('❌ Error in uploadPaymentProof:', err);
        throw err;
    }
};

// ✅ Optional: Get file from storage
export const getPaymentProof = async (filename: string): Promise<Blob | null> => {
    try {
        const { data, error } = await supabase
            .storage
            .from('payments')
            .download(filename);

        if (error) {
            throw new Error(`Download failed: ${error.message}`);
        }

        return data;
    } catch (err: any) {
        console.error('❌ Error in getPaymentProof:', err);
        throw err;
    }
};

// ✅ Optional: Delete file from storage
export const deletePaymentProof = async (filename: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .storage
            .from('payments')
            .remove([filename]);

        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }

        console.log('✅ File deleted successfully:', filename);
        return true;
    } catch (err: any) {
        console.error('❌ Error in deletePaymentProof:', err);
        throw err;
    }
};

// ✅ Optional: List all files in payments bucket
export const listPaymentProofs = async (orderId?: string) => {
    try {
        const { data, error } = await supabase
            .storage
            .from('payments')
            .list(orderId ? `${orderId}` : undefined, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            throw new Error(`List failed: ${error.message}`);
        }

        return data;
    } catch (err: any) {
        console.error('❌ Error in listPaymentProofs:', err);
        throw err;
    }
};

export default supabase;