// GMM with diagonal covariances

export class GMM {
  k: number;
  maxIter: number;
  N: number;
  dim: number;
  coefs: number[];
  means: number[][];
  covars: number[][]; // Diagonal covariance matrices (k x dim)
  probs: number[][];

  constructor(k: number, maxIter: number) {
    this.k = k;
    this.maxIter = maxIter;
    this.N = 0;
    this.dim = 0;
    this.coefs = GMM.vecMake(k, 1 / k);
    this.means = [];
    this.covars = []; // Now a 2D array (k x dim)
    this.probs = [];
  }

  cluster(X: number[][]) {
    this.N = X.length;
    this.dim = X[0].length;

    // Initialize means to k random data items
    this.means = GMM.matMake(this.k, this.dim);
    const idxs = this.select(this.N, this.k);
    for (let j = 0; j < this.k; ++j) {
      const idx = idxs[j];
      this.means[j] = [...X[idx]];
    }

    // Initialize covars to diagonal matrices (1s)
    this.covars = GMM.matMake(this.k, this.dim, 1.0);

    this.probs = GMM.matMake(this.N, this.k, 1.0 / this.k);

    for (let iter = 0; iter < this.maxIter; ++iter) {
      this.expectStep(X);
      this.maximStep(X);
    }
  }

  predictProbs(X: number[][]) {
    const result = GMM.matMake(this.N, this.k, 0.0);
    for (let j = 0; j < this.k; ++j) {
      for (let i = 0; i < this.N; ++i) {
        result[i][j] =
          this.coefs[j] *
          GMM.diagGaussianPdf(X[i], this.means[j], this.covars[j]);
      }
    }

    for (let i = 0; i < this.N; ++i) {
      const rowSum = result[i].reduce((sum, val) => sum + val, 0);
      for (let j = 0; j < this.k; ++j) result[i][j] /= rowSum;
    }

    return result;
  }

  predictLabels(X: number[][]) {
    const result = GMM.vecMake(this.N, 0);
    const probs = this.predictProbs(X);
    for (let i = 0; i < this.N; ++i) {
      result[i] = GMM.argMax(probs[i]);
    }
    return result;
  }

  expectStep(X: number[][]) {
    this.probs = this.predictProbs(X);
  }

  maximStep(X: number[][]) {
    const probSums = GMM.vecMake(this.k, 0.0);
    for (let i = 0; i < this.N; ++i) {
      for (let j = 0; j < this.k; ++j) {
        probSums[j] += this.probs[i][j];
      }
    }

    // Update coefficients
    for (let j = 0; j < this.k; ++j) {
      this.coefs[j] = probSums[j] / this.N;
    }

    // Update means
    const newMeans = GMM.matMake(this.k, this.dim, 0.0);
    for (let j = 0; j < this.k; ++j) {
      for (let i = 0; i < this.N; ++i) {
        for (let d = 0; d < this.dim; ++d) {
          newMeans[j][d] += X[i][d] * this.probs[i][j];
        }
      }
      for (let d = 0; d < this.dim; ++d) {
        newMeans[j][d] /= probSums[j];
      }
    }
    this.means = newMeans.map((row) => [...row]);

    // Update covariances (diagonal)
    const newCovars = GMM.matMake(this.k, this.dim, 0.0);
    for (let j = 0; j < this.k; ++j) {
      const mean = this.means[j];
      for (let i = 0; i < this.N; ++i) {
        const x = X[i];
        const p = this.probs[i][j];
        for (let d = 0; d < this.dim; ++d) {
          const diff = x[d] - mean[d];
          newCovars[j][d] += p * diff * diff;
        }
      }
      for (let d = 0; d < this.dim; ++d) {
        newCovars[j][d] = newCovars[j][d] / probSums[j] + 1e-6;
      }
    }
    this.covars = newCovars.map((row) => [...row]);
  }

  static diagGaussianPdf(x: number[], mean: number[], covar: number[]): number {
    const dim = x.length;
    let sumSq = 0.0;
    for (let d = 0; d < dim; d++) {
      const diff = x[d] - mean[d];
      sumSq += (diff * diff) / covar[d];
    }
    const exponent = -0.5 * sumSq;

    let productVar = 1.0;
    for (let d = 0; d < dim; d++) {
      productVar *= covar[d];
    }

    const norm = 1.0 / Math.sqrt((2 * Math.PI) ** dim * productVar);
    return norm * Math.exp(exponent);
  }

  static argMax(vec: number[]): number {
    return vec.reduce(
      (maxIdx, val, idx, arr) => (val > arr[maxIdx] ? idx : maxIdx),
      0,
    );
  }

  select(N: number, n: number): number[] {
    const indices = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, n);
  }

  static vecMake(n: number, val: number = 0): number[] {
    return new Array(n).fill(val);
  }

  static matMake(rows: number, cols: number, val: number = 0): number[][] {
    return Array.from({ length: rows }, () => new Array(cols).fill(val));
  }
}
