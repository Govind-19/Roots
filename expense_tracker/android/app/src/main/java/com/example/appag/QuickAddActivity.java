package com.example.appag;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

public class QuickAddActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_quick_add);

        // Set window to be floating/dialog-like if not handled by theme
        getWindow().setLayout(
                (int) (getResources().getDisplayMetrics().widthPixels * 0.9),
                android.view.ViewGroup.LayoutParams.WRAP_CONTENT);

        EditText inputName = findViewById(R.id.input_name);
        EditText inputAmount = findViewById(R.id.input_amount);
        Spinner spinnerCategory = findViewById(R.id.spinner_category);
        Button btnAdd = findViewById(R.id.btn_add);

        // Populate Categories
        String[] categories = new String[] { "Bills", "Food", "Transport", "Shopping", "Entertainment", "Health",
                "Other" };
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item,
                categories);
        spinnerCategory.setAdapter(adapter);

        btnAdd.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String name = inputName.getText().toString();
                String amount = inputAmount.getText().toString();
                String category = spinnerCategory.getSelectedItem().toString();

                if (amount.isEmpty()) {
                    Toast.makeText(QuickAddActivity.this, "Please enter an amount", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (name.isEmpty()) {
                    name = category; // Default name
                }

                // Construct Deep Link
                // app://save-transaction?name=...&amount=...&category=...
                Uri uri = Uri.parse("app://save-transaction")
                        .buildUpon()
                        .appendQueryParameter("name", name)
                        .appendQueryParameter("amount", amount)
                        .appendQueryParameter("category", category)
                        .build();

                Intent intent = new Intent(QuickAddActivity.this, MainActivity.class);
                intent.setAction(Intent.ACTION_VIEW);
                intent.setData(uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

                startActivity(intent);
                finish(); // Close this popup
            }
        });
    }
}
