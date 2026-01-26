import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService, Producto } from '../../services/product.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscar.html',
  styleUrls: ['./buscar.css'],
})
export class BuscarComponent implements OnInit {


  term = '';
  loading = true;
  results: Producto[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr : ChangeDetectorRef
  ) {}

  async ngOnInit() {
  this.route.queryParams.subscribe(async params => {
    this.term = params['q'] || '';

    this.loading = true;
    this.results = [];

    if (!this.term) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.results = await this.productService.search(this.term);
    this.loading = false;
    this.cdr.detectChanges();
    });
  }
}
