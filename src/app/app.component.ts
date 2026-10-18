import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlyerItem, metroDollardFlyer } from './metro-dollard-flyer';
import { frenchItemNames } from './item-translations';
import portionSizeConfig from './dinner-portion-sizes.json';

type ItemDraft = Omit<FlyerItem, 'id'>;
type DinnerCostEstimate = { total: number; quantity: number; unit: string; unitPrice: number; priceUnit: string };

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="app-shell" [attr.lang]="language()">
      <aside class="sidebar">
        <a class="brand" href="#" [attr.aria-label]="tr('Metro flyer grid home', 'Accueil de MetroGrid')"><span class="brand-mark">m</span><span class="brand-name">metro<span>grid</span></span></a>
        <div class="side-label">{{ tr("WORKSPACE", "ESPACE DE TRAVAIL") }}</div>
        <button class="nav-item active"><span class="nav-icon">▦</span>{{ tr("Flyer overview", "Vue d’ensemble") }}<span class="nav-count">{{ items().length }}</span></button>
        <div class="side-label list-label">{{ tr("YOUR LISTS", "VOS LISTES") }} <button class="tiny-plus" [title]="tr('New list', 'Nouvelle liste')" (click)="newList()">+</button></div>
        <button class="nav-item"><span class="dot coral"></span>{{ listName }}</button>
        <div class="side-bottom"><div class="help-card"><span class="help-spark">✳</span><strong>{{ tr("Make flyer week easier", "Simplifiez votre semaine de circulaire") }}</strong><p>{{ tr("Keep every deal sorted and ready for your next shop.", "Gardez chaque offre organisée pour vos prochaines courses.") }}</p><a href="https://www.metro.ca/circulaire" target="_blank" rel="noopener">{{ tr("Open Metro flyer", "Voir le circulaire Metro") }} ↗</a></div><div class="profile"><div class="avatar">M</div><div><strong>{{ tr("My workspace", "Mon espace") }}</strong><small>{{ tr("Personal account", "Compte personnel") }}</small></div><span class="more">···</span></div></div>
      </aside>

      <main class="main">
        <header class="topbar"><div class="crumb">{{ tr("My lists", "Mes listes") }} <span>/</span> <b>{{ displayListName() }}</b></div><div class="top-actions"><div class="language-switch" role="group" [attr.aria-label]="tr('Select language', 'Choisir la langue')"><button type="button" [class.active]="language() === 'en'" [attr.aria-pressed]="language() === 'en'" [attr.aria-label]="tr('English', 'Anglais')" (click)="setLanguage('en')">EN</button><button type="button" [class.active]="language() === 'fr'" [attr.aria-pressed]="language() === 'fr'" [attr.aria-label]="tr('French', 'Français')" (click)="setLanguage('fr')">FR</button></div><div class="measure-switch" role="group" [attr.aria-label]="tr('Select measurement system', 'Choisir le système de mesure')"><button type="button" [class.active]="measureSystem() === 'metric'" [attr.aria-pressed]="measureSystem() === 'metric'" (click)="measureSystem.set('metric')">{{ tr('METRIC', 'MÉTRIQUE') }}</button><button type="button" [class.active]="measureSystem() === 'imperial'" [attr.aria-pressed]="measureSystem() === 'imperial'" (click)="measureSystem.set('imperial')">{{ tr('IMPERIAL', 'IMPÉRIAL') }}</button></div><span class="week-chip"><i></i>{{ tr("WEEKLY FLYER", "CIRCULAIRE") }}</span><button class="icon-button" [title]="tr('Notifications', 'Avis')" [attr.aria-label]="tr('Notifications', 'Avis')">♧</button><div class="avatar small">M</div></div></header>
        <section class="content">
          <div class="heading-row"><div><div class="eyebrow"><span class="eyebrow-line"></span>{{ tr("METRO · WEEKLY DEALS", "METRO · OFFRES DE LA SEMAINE") }}</div><h1>{{ displayListName() }}</h1><p class="subtitle">{{ tr("Your flyer, neatly sorted. Keep the good stuff in sight.", "Votre circulaire bien organisé. Gardez les bonnes offres à portée de main.") }}</p></div><div class="heading-actions"><a class="button secondary" href="https://www.metro.ca/circulaire" target="_blank" rel="noopener"><span class="button-symbol">↗</span>{{ tr("Open Metro flyer", "Voir le circulaire Metro") }}</a><button class="button primary" (click)="downloadJson()"><span class="button-symbol">↓</span>{{ tr("Export JSON", "Exporter JSON") }}</button></div></div>

          <div class="refresh-strip"><span class="refresh-mark">↻</span><div><strong>{{ tr('Metro Plus Dollard · H8N 3G5', 'Metro Plus Dollard · H8N 3G5') }}</strong><small>{{ tr('Saved flyer snapshot · October 15–21, 2026', 'Circulaire enregistrée · 15–21 octobre 2026') }}</small></div><button class="button secondary" [title]="tr('Reloads the saved flyer snapshot; it does not fetch live Metro data.', 'Recharge la circulaire enregistrée; ne récupère pas les données en direct.')" (click)="refreshFlyer()"><span class="button-symbol">↻</span>{{ tr('Refresh grid', 'Actualiser la grille') }}</button></div>

          <div class="sample-notice"><span>✳</span><div><strong>Metro Plus Dollard · {{ tr(flyer.title, 'Circulaire') }}</strong><small>{{ flyer.address }} · {{ flyerPeriod() }}. {{ tr('Snapshot read from the official flyer; it does not auto-refresh. Check Metro for current availability.', 'Instantané relevé dans le circulaire officiel, sans mise à jour automatique. Vérifiez la disponibilité auprès de Metro.') }}</small></div><a [href]="flyer.url" target="_blank" rel="noopener">{{ tr("Open official flyer", "Voir le circulaire officiel") }} ↗</a></div>

          <section class="dinner-calculator" aria-labelledby="dinner-title">
            <div class="dinner-intro"><span class="dinner-icon">♨</span><div><h2 id="dinner-title">{{ tr('Dinner quantity calculator', 'Calculateur de quantité pour le repas') }}</h2><p>{{ tr('Estimate how much meat or fish to buy for dinner.', 'Estimez la quantité de viande ou de poisson à acheter pour le repas.') }}</p></div></div>
            <div class="dinner-controls">
              <label>{{ tr('Meat or fish', 'Viande ou poisson') }}<select [ngModel]="dinnerItemId()" (ngModelChange)="dinnerItemId.set($event)"><option *ngFor="let item of proteinItems()" [value]="item.id">{{ displayItemName(item) }}</option></select></label>
              <label>{{ tr('People', 'Personnes') }}<input type="number" min="1" max="50" [ngModel]="dinnerPeople()" (ngModelChange)="dinnerPeople.set(numberInRange($event, 1, 50, true))"></label>
              <label>{{ tr('Portion size', 'Taille de la portion') }}<select [ngModel]="portionSize()" (ngModelChange)="setPortionSize($event)"><option value="small">{{ tr('Small', 'Petite') }}</option><option value="medium">{{ tr('Medium', 'Moyenne') }}</option><option value="large">{{ tr('Large', 'Grande') }}</option></select></label>
              <div class="dinner-result">
                <div class="dinner-quantity"><small>{{ tr('ESTIMATED AMOUNT TO BUY', 'QUANTITÉ ESTIMÉE À ACHETER') }}</small><strong *ngIf="measureSystem() === 'metric'">{{ dinnerTotalGrams() | number:'1.0-0' }} g</strong><strong *ngIf="measureSystem() === 'imperial'">{{ dinnerTotalOunces() | number:'1.1-1' }} oz</strong><span *ngIf="measureSystem() === 'metric'">{{ dinnerTotalKilograms() | number:'1.2-2' }} kg</span><span *ngIf="measureSystem() === 'imperial'">{{ dinnerTotalPounds() | number:'1.2-2' }} lb</span></div>
                <div class="dinner-cost" *ngIf="dinnerCostEstimate() as cost"><small>{{ tr('ESTIMATED COST', 'COÛT ESTIMÉ') }}</small><strong>{{ formatPrice(cost.total) }}</strong><span>{{ cost.quantity | number:'1.0-2' }} {{ cost.unit }} × {{ formatPrice(cost.unitPrice) }}/{{ cost.priceUnit }}</span></div>
                <div class="dinner-cost unavailable" *ngIf="!dinnerCostEstimate()"><small>{{ tr('ESTIMATED COST', 'COÛT ESTIMÉ') }}</small><strong>—</strong><span>{{ tr('Price or package weight unavailable', 'Prix ou poids du paquet indisponible') }}</span></div>
              </div>
            </div>
            <p class="dinner-hint">{{ tr("Portion amounts use raw weight; adjust as needed.", "Les portions sont en poids cru; ajustez au besoin.") }}</p>
          </section>
          <div class="stat-row"><div class="stat-card"><div class="stat-label">{{ tr("ITEMS IN YOUR GRID", "ARTICLES DANS LA GRILLE") }} <span class="stat-icon peach">▦</span></div><div class="stat-value">{{ items().length }}<small>{{ tr("items", "articles") }}</small></div><div class="stat-foot">{{ tr("Across", "Dans") }} {{ categories().length }} {{ tr("categories", "catégories") }}</div></div><div class="stat-card"><div class="stat-label">{{ tr("AVERAGE DEAL", "ÉCONOMIE MOYENNE") }} <span class="stat-icon mint">↘</span></div><div class="stat-value">{{ savingsPercent() }}<small>{{ tr("% off", "de rabais") }}</small></div><div class="stat-foot">{{ tr("Compared with regular price", "par rapport au prix régulier") }}</div></div><div class="stat-card flyer-card"><div class="stat-label">{{ tr("THIS WEEK AT METRO", "CETTE SEMAINE CHEZ METRO") }} <span class="live-dot"></span></div><div class="flyer-info"><div class="calendar-icon"><b>{{ today | date:'d' }}</b><small>{{ language() === 'fr' ? frenchMonth : (today | date:'MMM') }}</small></div><div><strong>{{ tr("Fresh deals, every week", "De nouvelles offres chaque semaine") }}</strong><span>{{ tr("Check your local store for dates", "Vérifiez les dates auprès de votre magasin") }}</span></div></div><a href="https://www.metro.ca/circulaire" target="_blank" rel="noopener">{{ tr("View current flyer", "Voir le circulaire actuel") }} ↗</a></div></div>

          <div class="table-card">
            <div class="table-head"><div><h2>{{ tr("Flyer items", "Articles du circulaire") }} <span class="total-pill">{{ filteredItems().length }}</span></h2><p>{{ tr("Sorted by category, then item name", "Triés par catégorie, puis par nom") }}</p></div><div class="table-controls"><label class="search-box"><span>⌕</span><input [ngModel]="search()" (ngModelChange)="setSearch($event)" [placeholder]="tr('Search category or item…', 'Rechercher une catégorie ou un article…')" [attr.aria-label]="tr('Search category or item', 'Rechercher une catégorie ou un article')"><kbd>⌘ K</kbd></label><button class="filter-button" (click)="toggleCategoryMenu()">☷ <span>{{ selectedCategory() ? categoryLabel(selectedCategory()) : tr('All categories', 'Toutes les catégories') }}</span>⌄</button><div class="category-menu" *ngIf="categoryMenu()"><button (click)="setCategory('')">{{ tr("All categories", "Toutes les catégories") }}</button><button *ngFor="let category of categories()" (click)="setCategory(category)">{{ categoryLabel(category) }}</button></div><button class="button add-button" (click)="openAdd()"><span>+</span>{{ tr("Add item", "Ajouter") }}</button><button class="more-button" [title]="tr('More actions', 'Plus d’options')" (click)="downloadJson()">···</button></div></div>
            <div class="table-scroll"><table><thead><tr><th class="check-col"><input type="checkbox" [checked]="allChecked()" (change)="toggleAll($event)" [attr.aria-label]="tr('Select all visible items', 'Sélectionner tous les articles visibles')"></th><th>{{ tr("ITEM", "ARTICLE") }} <span>↕</span></th><th>{{ tr("CATEGORY", "CATÉGORIE") }} <span>↕</span></th><th>{{ tr("SIZE / FORMAT", "FORMAT") }}</th><th>{{ tr("SALE PRICE", "PRIX EN SOLDE") }} <span>↕</span></th><th>{{ tr("REGULAR", "RÉGULIER") }}</th><th>{{ tr("DEAL", "OFFRE") }}</th><th></th></tr></thead><tbody>
              <tr *ngFor="let item of pageItems(); let i = index" [class.selected]="isChecked(item.id)"><td><input type="checkbox" [checked]="isChecked(item.id)" (change)="toggleItem(item.id)" [attr.aria-label]="tr('Select ' + displayItemName(item), 'Sélectionner ' + displayItemName(item))"></td><td><div class="item-cell"><span class="item-thumb" [class]="'item-thumb thumb-' + (i % 6)">{{ iconFor(item.category) }}</span><span><strong>{{ displayItemName(item) }}</strong><small>{{ item.note || tr('Metro weekly flyer', 'Circulaire hebdomadaire Metro') }}</small></span></div></td><td><span class="category-tag" [class]="'category-tag cat-' + categoryClass(item.category)"><i></i>{{ categoryLabel(item.category) }}</span></td><td class="muted-cell">{{ displaySize(item.size) }}</td><td><strong class="sale-price">{{ formatPrice(displayPrice(item.price, item.unit)) }}<small> / {{ displayPriceUnit(item.unit) }}</small></strong></td><td class="regular-price">{{ formatPrice(displayPrice(item.regularPrice, item.unit)) }}</td><td><span class="deal-badge" *ngIf="discount(item) as deal">-{{ deal }}%</span><span class="no-deal" *ngIf="!discount(item)">—</span></td><td><button class="row-menu" [attr.aria-label]="tr('Delete ' + displayItemName(item), 'Supprimer ' + displayItemName(item))" [title]="tr('Delete item', 'Supprimer l’article')" (click)="remove(item.id)">×</button></td></tr>
              <tr *ngIf="filteredItems().length === 0"><td colspan="8" class="empty-state"><span>⌕</span><strong>{{ tr("No items found", "Aucun article trouvé") }}</strong><small>{{ tr("Try another search or add an item to this flyer.", "Essayez une autre recherche ou ajoutez un article.") }}</small></td></tr>
            </tbody></table></div>
            <div class="table-foot"><span>{{ tr("Showing", "Affichage") }} <b>{{ showingStart() }}–{{ showingEnd() }}</b> {{ tr('of', 'sur') }} <b>{{ filteredItems().length }}</b> {{ tr("items", "articles") }}</span><span class="foot-legend"><i></i>{{ tr("Deal price is lower than regular price", "Le prix en solde est inférieur au prix régulier") }}</span><div class="pagination" [attr.aria-label]="tr('Flyer item pages', 'Pages des articles du circulaire')"><button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">{{ tr("Prior", "Précédent") }}</button><span>{{ tr('Page', 'Page') }} {{ currentPage() }} {{ tr('of', 'sur') }} {{ totalPages() }}</span><button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">{{ tr("Next", "Suivant") }}</button></div><button class="json-mini" (click)="fileInput.click()">{{ tr("↑ Import JSON", "Importer JSON") }}</button></div>
          </div>
          <div class="bottom-note"><span class="note-icon">✳</span><span><b>{{ tr("Building your next shop?", "Vous préparez vos prochaines courses?") }}</b>{{ tr("Export this grid and import it next week to carry your list forward.", "Exportez cette grille et réimportez-la la semaine prochaine pour retrouver votre liste.") }}</span><button (click)="downloadJson()">{{ tr("Save this grid", "Enregistrer cette grille") }} <span>→</span></button></div>
        </section>
        <footer class="footer">METROGRID <span>·</span>{{ tr("A little more organized, every week", "Un peu plus organisé, chaque semaine") }} <a href="https://www.metro.ca/circulaire" target="_blank" rel="noopener">Metro.ca ↗</a></footer>
      </main>
    </div>
    <input #fileInput type="file" accept="application/json,.json" hidden (change)="importJson($event)">
    <div class="toast" *ngIf="toast()">{{ toast() }}</div>
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()"><section class="modal" (click)="$event.stopPropagation()"><div class="modal-top"><div><div class="eyebrow">{{ tr("ADD TO YOUR GRID", "AJOUTER À VOTRE GRILLE") }}</div><h2>{{ tr("New flyer item", "Nouvel article du circulaire") }}</h2></div><button class="close" [attr.aria-label]="tr('Close dialog', 'Fermer la fenêtre')" (click)="closeModal()">×</button></div><label>{{ tr("Item name", "Nom de l’article") }}<input [(ngModel)]="draft.item" [placeholder]="tr('e.g. Strawberries', 'ex. Fraises')"></label><div class="form-row"><label>{{ tr("Category", "Catégorie") }}<input [(ngModel)]="draft.category" list="categories" [placeholder]="tr('Produce', 'Fruits et légumes')"></label><datalist id="categories"><option *ngFor="let c of categories()" [value]="c"></option></datalist><label>{{ tr("Size / format", "Format") }}<input [(ngModel)]="draft.size" placeholder="454 g"></label></div><div class="form-row"><label>{{ tr("Sale price", "Prix en solde") }}<input type="number" min="0" step="0.01" [(ngModel)]="draft.price" placeholder="0.00"></label><label>{{ tr("Regular price", "Prix régulier") }}<input type="number" min="0" step="0.01" [(ngModel)]="draft.regularPrice" placeholder="0.00"></label><label>{{ tr("Unit", "Unité") }}<input [(ngModel)]="draft.unit" [placeholder]="tr('each', 'unité')"></label></div><label>{{ tr("Note", "Remarque") }} <span class="optional">{{ tr("OPTIONAL", "FACULTATIF") }}</span><input [(ngModel)]="draft.note" [placeholder]="tr('Brand, offer details, origin…', 'Marque, détails de l’offre, origine…')"></label><div class="modal-actions"><button class="button secondary" (click)="closeModal()">{{ tr("Cancel", "Annuler") }}</button><button class="button primary" [disabled]="!draft.item.trim()" (click)="saveItem()">{{ tr("Add item", "Ajouter") }}</button></div></section></div>
  `,
  styleUrls: ['./app.component.css', './pagination.css']
})
export class AppComponent {
  readonly today = new Date();
  readonly language = signal<'en' | 'fr'>('fr');
  readonly flyer = metroDollardFlyer;
  readonly items = signal<FlyerItem[]>(metroDollardFlyer.items);
  readonly search = signal('');
  readonly selectedCategory = signal('');
  readonly categoryMenu = signal(false);
  readonly toast = signal('');
  readonly selected = signal<string[]>([]);
  readonly proteinItems = computed(() => this.items().filter(item => item.category === 'Meat' || item.category === 'Seafood' || item.category === 'Meat & seafood'));
  readonly dinnerItemId = signal(metroDollardFlyer.items.find(item => item.category === 'Meat' || item.category === 'Seafood')?.id ?? '');
  readonly dinnerPeople = signal(4);
  readonly portionSize = signal<'small' | 'medium' | 'large'>('medium');
  readonly portionGrams = computed(() => portionSizeConfig[this.portionSize()]);
  readonly measureSystem = signal<'metric' | 'imperial'>('metric');
  readonly dinnerTotalGrams = computed(() => this.dinnerPeople() * this.portionGrams());
  readonly dinnerTotalPounds = computed(() => this.dinnerTotalGrams() / 453.59237);
  readonly dinnerTotalKilograms = computed(() => this.dinnerTotalGrams() / 1000);
  readonly dinnerTotalOunces = computed(() => this.dinnerTotalGrams() / 28.349523125);
  readonly dinnerCostEstimate = computed<DinnerCostEstimate | null>(() => {
    const item = this.items().find(candidate => candidate.id === this.dinnerItemId());
    if (!item || item.price === null) return null;
    if (item.unit === 'lb' || item.unit === '100 g') {
      const quantity = this.measureSystem() === 'metric' ? this.dinnerTotalGrams() / 1000 : this.dinnerTotalGrams() / 453.59237;
      const priceUnit = this.displayPriceUnit(item.unit);
      const unitPrice = this.displayPrice(item.price, item.unit)!;
      return { total: quantity * unitPrice, quantity, unit: priceUnit, unitPrice, priceUnit };
    }
    const packageGrams = this.packageWeightGrams(item.size);
    if (packageGrams === null) return null;
    const quantity = Math.ceil(this.dinnerTotalGrams() / packageGrams);
    const unit = this.language() === 'fr' ? this.frenchUnit(item.unit) : item.unit;
    return { total: quantity * item.price, quantity, unit, unitPrice: item.price, priceUnit: unit };
  });
  readonly filteredItems = computed(() => {
    const query = this.search().trim().toLowerCase(); const category = this.selectedCategory();
    return [...this.items()].filter(x => (!category || x.category === category) && (!query || x.category.toLowerCase().includes(query) || this.frenchCategory(x.category).toLowerCase().includes(query) || x.item.toLowerCase().includes(query) || this.displayItemName(x).toLowerCase().includes(query))).sort((a,b) => a.category.localeCompare(b.category) || this.displayItemName(a).localeCompare(this.displayItemName(b)));
  });
  readonly pageSize = 10;
  readonly frenchMonth = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][this.today.getMonth()];
  readonly page = signal(1);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly pageItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });
  readonly showingStart = computed(() => this.filteredItems().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1);
  readonly showingEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredItems().length));
  readonly categories = computed(() => [...new Set(this.items().map(x => x.category))].sort((a,b) => a.localeCompare(b)));
  readonly savingsPercent = computed(() => { const valid = this.items().filter(x => x.price !== null && x.regularPrice !== null && x.regularPrice > 0); if (!valid.length) return 0; return Math.round(valid.reduce((n,x) => n + (1 - (x.price! / x.regularPrice!)) * 100, 0) / valid.length); });
  listName = 'Metro Plus Dollard flyer'; showModal = false;
  draft: ItemDraft = this.emptyDraft();
  readonly allChecked = computed(() => this.pageItems().length > 0 && this.pageItems().every(x => this.selected().includes(x.id)));
  private toastTimer?: ReturnType<typeof setTimeout>;
  tr(english: string, french: string): string { return this.language() === 'fr' ? french : english; }
  setLanguage(language: 'en' | 'fr'): void { this.language.set(language); document.documentElement.lang = language; }
  displayListName(): string {
    if (this.listName === 'Metro Plus Dollard flyer') return this.tr('Metro Plus Dollard flyer', 'Circulaire Metro Plus Dollard');
    if (this.listName === 'Metro weekly flyer') return this.tr('Metro weekly flyer', 'Circulaire Metro hebdomadaire');
    return this.listName;
  }
  flyerPeriod(): string {
    return this.language() === 'fr' ? '15–21 oct. 2026' : `${this.flyer.startDate}–${this.flyer.endDate}`;
  }
  formatPrice(price: number | null): string {
    if (price === null) return '—';
    return new Intl.NumberFormat(this.language() === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' }).format(price);
  }
  categoryLabel(category: string): string { return this.tr(category, this.frenchCategory(category)); }
  displayItemName(item: FlyerItem): string { return this.language() === 'fr' ? (frenchItemNames[item.item] ?? item.item) : item.item; }
  numberInRange(value: string | number, min: number, max: number, wholeNumber = false): number {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? parsed : min;
    const bounded = Math.min(max, Math.max(min, safeValue));
    return wholeNumber ? Math.round(bounded) : bounded;
  }
  setPortionSize(value: string): void {
    if (value === 'small' || value === 'medium' || value === 'large') this.portionSize.set(value);
  }
  private packageWeightGrams(size: string): number | null {
    const weights = [...size.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|lb)\b/gi)].map(match => {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      return unit === 'kg' ? amount * 1000 : unit === 'lb' ? amount * 453.59237 : amount;
    }).filter(weight => weight > 0);
    return weights.length ? Math.min(...weights) : null;
  }
  displaySize(size: string): string {
    if (this.measureSystem() === 'imperial') {
      return size
        .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, (_match, amount: string) => `${(Number(amount) * 2.20462262).toFixed(2)} lb`)
        .replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_match, amount: string) => `${(Number(amount) / 28.349523125).toFixed(1)} oz`)
        .replace(/(\d+(?:\.\d+)?)\s*L\b/g, (_match, amount: string) => `${(Number(amount) * 33.814).toFixed(1)} fl oz`);
    }
    return size
      .replace(/(\d+)\s*[–-]\s*(\d+)\s+shrimp per lb/gi, (_match, low: string, high: string) => `${Math.round(Number(low) * 2.20462262)}–${Math.round(Number(high) * 2.20462262)} shrimp per kg`)
      .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, (_match, amount: string) => `${(Number(amount) * 1000).toFixed(0)} g`)
      .replace(/(\d+(?:\.\d+)?)\s*lb\b/gi, (_match, amount: string, offset: number, source: string) => source.slice(Math.max(0, offset - 4), offset).toLowerCase().includes('per ') ? `${amount} lb` : `${(Number(amount) * 453.59237).toFixed(0)} g`);
  }
  displayPriceUnit(unit: string): string {
    if (unit === 'lb' || unit === '100 g') return this.measureSystem() === 'metric' ? 'kg' : 'lb';
    return this.language() === 'fr' ? this.frenchUnit(unit) : unit;
  }
  displayPrice(price: number | null, unit: string): number | null {
    if (price === null) return null;
    if (this.measureSystem() === 'metric') {
      if (unit === 'lb') return price * 2.20462262;
      if (unit === '100 g') return price * 10;
    } else if (unit === '100 g') return price * 4.5359237;
    return price;
  }
  emptyDraft(): ItemDraft { return { category: 'Produce', item: '', size: '', price: null, unit: 'each', regularPrice: null, note: '' }; }
  discount(item: FlyerItem): number | null { return item.price !== null && item.regularPrice !== null && item.regularPrice > item.price ? Math.round((1 - item.price / item.regularPrice) * 100) : null; }
  iconFor(category: string): string { return ({ 'Produce':'✳', 'Meat':'◒', 'Seafood':'🐟', 'Meat & seafood':'◒', 'Dairy & eggs':'◉', 'Pantry':'▤', 'Bakery':'♨', 'Frozen':'❄' } as Record<string,string>)[category] || '✳'; }
  frenchCategory(category: string): string { return ({ 'Produce':'Fruits et légumes', 'Meat':'Viande', 'Seafood':'Poisson et fruits de mer', 'Meat & seafood':'Viande et fruits de mer', 'Dairy & eggs':'Produits laitiers et œufs', 'Pantry':'Épicerie', 'Bakery':'Boulangerie', 'Frozen':'Surgelés' } as Record<string,string>)[category] ?? category; }
  frenchUnit(unit: string): string { return ({ 'each':'unité', 'pack':'paquet', 'bag':'sac', 'box':'boîte' } as Record<string,string>)[unit] ?? unit; }
  categoryClass(category: string): string { return category.toLowerCase().replace(/[^a-z]+/g,'-').replace(/(^-|-$)/g,''); }
  isChecked(id: string): boolean { return this.selected().includes(id); }
  toggleItem(id: string): void { this.selected.update(a => a.includes(id) ? a.filter(x => x !== id) : [...a,id]); }
  toggleAll(event: Event): void { const checked = (event.target as HTMLInputElement).checked; const visible = this.pageItems().map(x => x.id); this.selected.update(a => checked ? [...new Set([...a,...visible])] : a.filter(x => !visible.includes(x))); }
  toggleCategoryMenu(): void { this.categoryMenu.update(v => !v); }
  setSearch(query: string): void { this.search.set(query); this.page.set(1); }
  goToPage(page: number): void { this.page.set(Math.max(1, Math.min(page, this.totalPages()))); }
  setCategory(category: string): void { this.selectedCategory.set(category); this.page.set(1); this.categoryMenu.set(false); }
  openAdd(): void { this.draft = this.emptyDraft(); this.showModal = true; }
  closeModal(): void { this.showModal = false; }
  saveItem(): void { if (!this.draft.item.trim()) return; this.items.update(a => [...a,{ ...this.draft, id: crypto.randomUUID(), category: this.draft.category.trim() || 'Other', item: this.draft.item.trim() }]); this.page.set(1); this.showModal = false; this.notify('Item added to your flyer grid'); }
  remove(id: string): void { this.items.update(a => a.filter(x => x.id !== id)); this.selected.update(a => a.filter(x => x !== id)); this.notify('Item removed'); }
  refreshFlyer(): void {
    this.items.set(metroDollardFlyer.items.map(item => ({ ...item })));
    this.listName = 'Metro Plus Dollard flyer';
    this.search.set('');
    this.selectedCategory.set('');
    this.selected.set([]);
    this.page.set(1);
    this.notify('Flyer grid refreshed from the saved Metro Plus Dollard snapshot');
  }
  newList(): void { this.listName = 'Metro weekly flyer'; this.items.set([]); this.page.set(1); this.notify('Started a fresh flyer grid'); }
  downloadJson(): void { const payload = { app: 'MetroGrid', version: 1, listName: this.listName, exportedAt: new Date().toISOString(), items: this.items() }; const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `metro-flyer-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); this.notify('Flyer grid saved as JSON'); }
  importJson(event: Event): void { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed: unknown = JSON.parse(String(reader.result)); const raw = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && 'items' in parsed ? (parsed as {items: unknown}).items : null); if (!Array.isArray(raw) || !raw.every(x => x && typeof x === 'object' && typeof (x as Record<string,unknown>)['item'] === 'string' && typeof (x as Record<string,unknown>)['category'] === 'string')) throw new Error('Invalid'); const imported = raw.map((x,i) => { const value = x as Record<string,unknown>; return { id: typeof value['id'] === 'string' ? value['id'] : `import-${Date.now()}-${i}`, category: String(value['category']) === 'Meat & seafood' ? (String(value['id'] ?? '').startsWith('dollard-seafood-') ? 'Seafood' : 'Meat') : String(value['category']), item: String(value['item']), size: String(value['size'] ?? ''), price: typeof value['price'] === 'number' ? value['price'] : null, unit: String(value['unit'] ?? 'each'), regularPrice: typeof value['regularPrice'] === 'number' ? value['regularPrice'] : null, note: String(value['note'] ?? '') }; }); this.items.set(imported); if (!Array.isArray(parsed) && parsed && typeof parsed === 'object' && 'listName' in parsed && typeof (parsed as {listName?:unknown}).listName === 'string') this.listName = (parsed as {listName:string}).listName; this.search.set(''); this.selectedCategory.set(''); this.page.set(1); this.selected.set([]); this.notify(`Imported ${imported.length} flyer items`); } catch { this.notify('Could not read this JSON. Choose a MetroGrid export.'); } input.value = ''; }; reader.readAsText(file); }
  private notify(message: string): void {
    const frenchMessages: Record<string, string> = {
      'Item added to your flyer grid': 'Article ajouté à votre grille',
      'Item removed': 'Article supprimé',
      'Started a fresh flyer grid': 'Nouvelle grille créée',
      'Flyer grid saved as JSON': 'Grille enregistrée au format JSON',
      'Could not read this JSON. Choose a MetroGrid export.': 'Impossible de lire ce fichier JSON. Choisissez un export MetroGrid.',
    };
    const imported = message.match(/^Imported (\d+) flyer items$/);
    const french = imported ? `${imported[1]} articles du circulaire importés` : (frenchMessages[message] ?? message);
    this.toast.set(this.tr(message, french));
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2800);
  }
}
