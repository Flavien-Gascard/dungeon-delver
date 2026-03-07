from pathlib import Path
import csv
from nicegui import ui

CSV_PATH = Path(__file__).with_name('Chase6713_Activity_20260307.CSV')


def parse_amount(value: str) -> float:
    if value is None:
        return 0.0
    text = str(value).strip().replace('$', '').replace(',', '')
    if text.startswith('(') and text.endswith(')'):
        text = f'-{text[1:-1]}'
    try:
        return float(text)
    except ValueError:
        return 0.0


def load_csv(path: Path):
    # Keyword rules for grouping
    keyword_categories = {
        'PAYROLL': 'Income',
        'GROCERY': 'Food',
        'RENT': 'Housing',
        'AMAZON': 'Shopping',
        'GAS': 'Transport',
        'UBER': 'Transport',
        'TARGET': 'Shopping',
        'WALMART': 'Shopping',
        'ELECTRIC': 'Utilities',
        'WATER': 'Utilities',
        'PHONE': 'Utilities',
        'DINER': 'Food',
        'RESTAURANT': 'Food',
        'TRANSFER': 'Transfer',
        'ATM': 'Cash',
        'BANK': 'Bank',
    }

    with path.open(newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        data_rows = []
        for i, row in enumerate(reader, start=1):
            clean = {'id': i}
            for h in headers:
                clean[h] = (row.get(h) or '').strip()
            # Categorize by description
            desc = clean.get('Description', '') or clean.get('details', '') or ''
            found = None
            for kw, cat in keyword_categories.items():
                if kw in desc.upper():
                    found = cat
                    break
            clean['Category'] = found or 'Other'
            data_rows.append(clean)

    columns = [{'name': 'id', 'label': 'ID', 'field': 'id', 'sortable': True}]
    for h in headers:
        columns.append({'name': h, 'label': h, 'field': h, 'sortable': True})
    columns.append({'name': 'Category', 'label': 'Category', 'field': 'Category', 'sortable': True})

    return headers, columns, data_rows


ui.dark_mode(True)

with ui.column().classes('w-full max-w-7xl mx-auto p-4'):
    # Input box for subtracting value from 'Other' category
    subtract_input = ui.input('Subtract from Other (amount)').props('type=number step=0.01').classes('mb-4')
    expenses_label = ui.label().classes('text-lg font-semibold text-red-400 mb-2')
    incomes_label = ui.label().classes('text-lg font-semibold text-green-400 mb-2')
    # Header info removed for cleaner display

    # Removed monthly_income_label and payroll_income_label from the top

    try:
        headers, columns, all_rows = load_csv(CSV_PATH)
    except FileNotFoundError:
        headers, columns, all_rows = [], [], []
        ui.notify(f'File not found: {CSV_PATH.name}', type='negative')

    # Breakdown by Category (after CSV load)
    category_cards = {}
    unique_categories = sorted({r['Category'] for r in all_rows if r.get('Category')})
    with ui.row().classes('w-full flex-wrap gap-4 mb-4'):
        for cat in unique_categories:
            card_classes = 'p-4 bg-gray-900 text-white min-w-80' if cat != 'Other' else 'p-4 bg-gray-900 text-white min-w-80'  # min-w-80 for all, no fixed width
            with ui.card().classes(card_classes):
                ui.label(cat).classes('text-xl font-bold mb-2')
                if cat == 'Other':
                    category_cards[cat] = {
                        'expenses': ui.html().classes('text-lg text-red-400 mb-1'),
                        'incomes': ui.label().classes('text-lg text-green-400 mb-1')
                    }
                else:
                    category_cards[cat] = {
                        'expenses': ui.label().classes('text-lg text-red-400 mb-1'),
                        'incomes': ui.label().classes('text-lg text-green-400 mb-1')
                    }

    # Removed breakdown by Type labels under the cards

    search_box = ui.input('Search keywords').classes('w-full mb-4')
    filter_controls = {}

    with ui.row().classes('w-full gap-3 flex-wrap mb-4'):
        for h in headers:
            values = sorted({r[h] for r in all_rows if r[h] != ''})
            filter_controls[h] = ui.select(
                options=['All'] + values,
                value='All',
                label=f'Filter: {h}',
            ).classes('w-64')
        # Add Category filter
        category_values = sorted({r['Category'] for r in all_rows if r['Category']})
        filter_controls['Category'] = ui.select(
            options=['All'] + category_values,
            value='All',
            label='Filter: Category',
        ).classes('w-64')

    table = ui.table(columns=columns, rows=all_rows, row_key='id').classes('w-full')
    # Footer info removed for cleaner display
    rows_label = None
    total_label = None

    amount_header = next((h for h in headers if 'amount' in h.lower()), None)

    def apply_filters():
        # Breakdown by Category in cards (only subtraction-adjusted value shown)
        for cat in category_cards:
            cat_rows = [r for r in all_rows if r['Category'] == cat]
            cat_expenses_total = sum(a for a in [parse_amount(r.get(amount_header, '0')) for r in cat_rows] if a < 0)
            cat_incomes_total = sum(a for a in [parse_amount(r.get(amount_header, '0')) for r in cat_rows] if a > 0)
            # Subtract user value from 'Other' category
            if cat == 'Other':
                try:
                    subtract_val = float(subtract_input.value or 0)
                except Exception:
                    subtract_val = 0
                # Make expense less negative (closer to zero)
                cat_expenses_total += abs(subtract_val)
            # Hide expense summary if $0.00
            if cat_expenses_total != 0:
                if hasattr(category_cards[cat]['expenses'], 'content'):
                    category_cards[cat]['expenses'].content = f"Expenses: ${cat_expenses_total:,.2f}"
                else:
                    category_cards[cat]['expenses'].text = f"Expenses: ${cat_expenses_total:,.2f}"
            else:
                if hasattr(category_cards[cat]['expenses'], 'content'):
                    category_cards[cat]['expenses'].content = ""
                else:
                    category_cards[cat]['expenses'].text = ""
            # Hide income summary if $0.00
            if cat_incomes_total != 0:
                if hasattr(category_cards[cat]['incomes'], 'content'):
                    category_cards[cat]['incomes'].content = f"Income: ${cat_incomes_total:,.2f}"
                else:
                    category_cards[cat]['incomes'].text = f"Income: ${cat_incomes_total:,.2f}"
            else:
                if hasattr(category_cards[cat]['incomes'], 'content'):
                    category_cards[cat]['incomes'].content = ""
                else:
                    category_cards[cat]['incomes'].text = ""

        # Further breakdown for all categories
        for cat in category_cards:
            cat_rows = [r for r in all_rows if r['Category'] == cat]
            # Find top keywords in descriptions
            keyword_counts = {}
            for r in cat_rows:
                desc = r.get('Description', '') or r.get('details', '') or ''
                words = [w for w in desc.split() if len(w) > 2]
                for w in words:
                    w_up = w.upper()
                    keyword_counts[w_up] = keyword_counts.get(w_up, 0) + 1
            # Only show main expense summary, no keyword breakdowns
            cat_expenses_total = sum(a for a in [parse_amount(r.get(amount_header, '0')) for r in cat_rows] if a < 0)
            cat_incomes_total = sum(a for a in [parse_amount(r.get(amount_header, '0')) for r in cat_rows] if a > 0)
            # Subtract user value from 'Other' category
            if cat == 'Other':
                try:
                    subtract_val = float(subtract_input.value or 0)
                except Exception:
                    subtract_val = 0
                cat_expenses_total -= subtract_val
            # Hide expense summary if $0.00
            if cat_expenses_total != 0:
                if hasattr(category_cards[cat]['expenses'], 'content'):
                    category_cards[cat]['expenses'].content = f"Expenses: ${cat_expenses_total:,.2f}"
                else:
                    category_cards[cat]['expenses'].text = f"Expenses: ${cat_expenses_total:,.2f}"
            else:
                if hasattr(category_cards[cat]['expenses'], 'content'):
                    category_cards[cat]['expenses'].content = ""
                else:
                    category_cards[cat]['expenses'].text = ""
            # Hide income summary if $0.00
            if cat_incomes_total != 0:
                if hasattr(category_cards[cat]['incomes'], 'content'):
                    category_cards[cat]['incomes'].content = f"Income: ${cat_incomes_total:,.2f}"
                else:
                    category_cards[cat]['incomes'].text = f"Income: ${cat_incomes_total:,.2f}"
            else:
                if hasattr(category_cards[cat]['incomes'], 'content'):
                    category_cards[cat]['incomes'].content = ""
                else:
                    category_cards[cat]['incomes'].text = ""

        filtered = all_rows
        # Apply column filters
        for h, control in filter_controls.items():
            selected = control.value
            if selected and selected != 'All':
                filtered = [r for r in filtered if str(r[h]) == str(selected)]
        # Apply search filter
        search = search_box.value.strip().lower()
        if search:
            filtered = [
                r for r in filtered
                if any(search in str(r[h]).lower() for h in headers)
            ]

        table.rows = filtered
        table.update()

        if amount_header:
            # Always use all_rows for amount calculations, not filtered
            amounts = [parse_amount(r.get(amount_header, '0')) for r in all_rows]
            total_expenses = sum(a for a in amounts if a < 0)
            total_incomes = sum(a for a in amounts if a > 0)
            # Apply subtraction adjustment to total expenses
            try:
                subtract_val = float(subtract_input.value or 0)
            except Exception:
                subtract_val = 0
            total_expenses += abs(subtract_val)
            expenses_label.text = f'Total Expenses (amount): ${total_expenses:,.2f}'
            incomes_label.text = f'Total Incomes (amount): ${total_incomes:,.2f}'

            # Removed breakdown by Type update

    search_box.on_value_change(lambda _: apply_filters())
    subtract_input.on_value_change(lambda _: apply_filters())
    for control in filter_controls.values():
        control.on_value_change(lambda _: apply_filters())

    apply_filters()

ui.run(title='Budget Planner')