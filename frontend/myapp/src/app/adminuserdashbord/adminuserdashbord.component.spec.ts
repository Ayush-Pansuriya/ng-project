import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminuserdashbordComponent } from './adminuserdashbord.component';

describe('AdminuserdashbordComponent', () => {
  let component: AdminuserdashbordComponent;
  let fixture: ComponentFixture<AdminuserdashbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminuserdashbordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminuserdashbordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
