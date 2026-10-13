import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ConfirmService } from '@core/ui/confirm.service';
import { ToastService } from '@core/ui/toast.service';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { saveBlob } from '@shared/utils/files';
import { formatBytes, TONE } from '@shared/utils/labels';
import { RequestsApi } from '../../requests.api';
import { RequestDto, RequestHistoryDto } from '../../requests.models';

@Component({
  selector: 'app-request-detail',
  imports: [RouterLink, FormsModule, LocalDatePipe, TranslatePipe],
  templateUrl: './request-detail.html',
})
export class RequestDetailPage implements OnInit {
  private readonly api = inject(RequestsApi);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly request = signal<RequestDto | null>(null);
  readonly history = signal<RequestHistoryDto[]>([]);
  reason = '';
  readonly tone = TONE;
  readonly formatBytes = formatBytes;

  ngOnInit(): void {
    this.reload();
  }

  private id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reload(): void {
    const id = this.id();
    this.api.getRequest(id).subscribe({
      next: (r) => this.request.set(r),
      error: (e) => this.toast.apiError(e),
    });
    this.api.getRequestHistory(id).subscribe({
      next: (h) => this.history.set(h),
      error: () => undefined,
    });
  }

  download(attachmentId: number, name: string): void {
    this.api.downloadAttachment(this.id(), attachmentId).subscribe({
      next: (b) => saveBlob(b, name || 'attachment.pdf'),
      error: (e) => this.toast.apiError(e),
    });
  }

  async approve(): Promise<void> {
    if (!(await this.confirm.ask('requests.detail.approveTitle', 'requests.detail.approveMessage', 'requests.detail.approve'))) return;
    this.api.approveRequest(this.id()).subscribe({
      next: (r) => {
        this.request.set(r);
        this.toast.ok('requests.detail.approved');
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  reject(): void {
    if (!this.reason.trim()) {
      this.toast.error('requests.detail.reasonRequired');
      return;
    }
    this.api.rejectRequest(this.id(), this.reason).subscribe({
      next: (r) => {
        this.request.set(r);
        this.toast.ok('requests.detail.rejected');
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }

  sendBack(): void {
    if (!this.reason.trim()) {
      this.toast.error('requests.detail.reasonRequired');
      return;
    }
    this.api.returnRequest(this.id(), this.reason).subscribe({
      next: (r) => {
        this.request.set(r);
        this.toast.ok('requests.detail.returned');
        this.reload();
      },
      error: (e) => this.toast.apiError(e),
    });
  }
}
