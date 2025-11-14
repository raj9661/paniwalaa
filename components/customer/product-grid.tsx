import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

type Product = {
  id: string
  title: string
  description: string | null
  priceCents: number | string
  imageUrl: string | null
  productType: string
  isAvailable: boolean
  isOneTimePurchase?: boolean
  securityDepositCents?: string | null
  brand?: string | null
}

type ProductGridProps = {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const price = Number(product.priceCents) / 100
        const productTypeLabel = product.productType === '20L_jar' ? '20L Jar' 
          : product.productType === '10L_jar' ? '10L Jar' 
          : 'Water Dispenser'
        
        return (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2">
            <div className="aspect-square bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-8">
              <img
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">{product.brand || productTypeLabel}</p>
                </div>
                {product.isAvailable && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    In Stock
                  </Badge>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-foreground">₹{price.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{productTypeLabel.toLowerCase()}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-1"
                  onClick={() => onAddToCart(product)}
                  disabled={!product.isAvailable}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
